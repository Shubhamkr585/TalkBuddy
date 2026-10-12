// loadtest.v2.js  (Node 20+, needs socket.io-client, which you already have)
//
//   node loadtest.v2.js                              # 100 users, header mode (works with your current code)
//   USERS=500 DURATION=120 RAMP_MS=20 node loadtest.v2.js
//   MODE=cookie USERS=200 node loadtest.v2.js        # after the Nginx auth_request fix: signs up users and uses real JWT cookies
//
// What is different from loadtest.js:
//  - users are paired (A sends to B), so you also measure DELIVERY latency, not only ack latency
//  - success, failure and timeout are counted separately (an ack with ok:false is a FAILURE, not a success)
//  - aborts early if too few sockets connect, instead of reporting "0 ms"
//  - p50 / p95 / p99, a warm-up period that is excluded from stats, and the per-instance split

import { io } from "socket.io-client";
import crypto from "crypto";

const URL = process.env.URL || "http://127.0.0.1:8080";
const USERS = Number(process.env.USERS || 100);        // keep it even: users are paired
const DURATION = Number(process.env.DURATION || 60);   // seconds of measured traffic
const WARMUP = Number(process.env.WARMUP || 10);       // seconds excluded from the stats
const RAMP_MS = Number(process.env.RAMP_MS || 20);     // delay between connection attempts
const MODE = process.env.MODE || "header";             // header | cookie
const INTERVAL_MS = Number(process.env.INTERVAL_MS || 1000);   // time between messages per user (1000 = 1 msg/s, 5000 = 1 msg per 5 s)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (a, q) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)];
};
const bump = (o, k) => (o[k] = (o[k] || 0) + 1);

const connectErrors = {}, ackErrors = {}, perInstance = {};
const ackMs = [], deliveryMs = [], instOf = [];
let genLagMax = 0, lastTick = Date.now();
setInterval(() => { const n = Date.now(); genLagMax = Math.max(genLagMax, n - lastTick - 100); lastTick = n; }, 100);   // if this gets big, the load generator itself is the bottleneck
let connected = 0, peak = 0, sent = 0, ok = 0, failed = 0, timedOut = 0, received = 0;

async function post(path, body) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await fetch(`${URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch (e) {                                      // ECONNRESET etc. (Docker Desktop on Windows resets some connections)
      if (attempt === 5) throw new Error(`POST ${path} failed after 5 tries: ${e.cause?.code ?? e.message}`);
      await sleep(250 * attempt);
    }
  }
}

const DUMMY_PWD = `Tst_${crypto.randomBytes(4).toString("hex")}!`;

async function makeUser(name) {
  const creds = { name, password: process.env.TEST_USER_PASSWORD || DUMMY_PWD };
  let r = await post("/api/auth/signup", creds);
  if (r.status === 400) r = await post("/api/auth/login", creds);   // signup may have succeeded before a reset: log in instead
  if (!r.ok) throw new Error(`signup/login failed: HTTP ${r.status} ${await r.text()}`);
  return { id: (await r.json()).user._id, cookie: r.headers.getSetCookie()[0].split(";")[0] };
}

async function makeUsers() {
  if (MODE === "header") return Array.from({ length: USERS }, (_, i) => ({ id: `lt_user_${i}` }));
  const run = Date.now(), out = [], C = Number(process.env.SIGNUP_CONCURRENCY || 3);   // few at a time: bcrypt is slow
  for (let i = 0; i < USERS; i += C) {
    out.push(...await Promise.all(Array.from({ length: Math.min(C, USERS - i) }, (_, j) => makeUser(`lt_${run}_${i + j}`))));
  }
  return out;
}

console.log(`Starting: ${USERS} users, mode=${MODE}, warmup=${WARMUP}s, measured=${DURATION}s, target=${URL}`);
let users;
try { users = await makeUsers(); }
catch (e) { console.error("\nCould not create test users:", e.message, "\nCheck: docker compose logs --tail=40 auth-backend api-gateway nginx"); process.exit(1); }
const sockets = [];

for (const u of users) {
  const s = io(URL, {
    transports: ["websocket"], reconnection: false,
    extraHeaders: MODE === "cookie" ? { cookie: u.cookie } : { "x-user-id": u.id },
  });
  s.on("connect", () => { connected++; peak = Math.max(peak, connected); });
  s.on("disconnect", () => connected--);
  s.on("connect_error", (e) => {                                  // one counter per message, not a 40-line stack trace
    const detail = e.description?.message ?? e.description?.error?.message;   // e.g. "Unexpected server response: 502"
    bump(connectErrors, detail ? `${e.message} | ${detail}` : e.message);
  });
  sockets.push(s);
  await sleep(RAMP_MS);
}
await sleep(3000);
console.log(`Connected ${connected}/${USERS}`);
if (connected < USERS * 0.95) {
  console.log("Aborting: too many sockets failed to connect. Errors:", connectErrors);
  process.exit(1);
}

const T0 = Date.now();
const counted = (t) => t - T0 > WARMUP * 1000;

sockets.forEach((s) => s.on("private_message", (m) => {
  const t0 = Number(String(m.text).split("|")[1]);
  if (counted(t0)) { received++; deliveryMs.push(Date.now() - t0); }
}));

const intervals = [];
sockets.forEach((s, i) => {
  const to = users[i ^ 1]?.id;                          // partner in the pair
  if (!to) return;
  setTimeout(() => intervals.push(setInterval(() => {
    if (!s.connected) return;
    const t0 = Date.now(), isCounted = counted(t0);
    if (isCounted) sent++;
    s.timeout(5000).emit("message:send",
      { receiverId: to, text: `lt|${t0}`, clientMsgId: crypto.randomUUID() },
      (err, res) => {
        if (!isCounted) return;
        if (err) { timedOut++; return; }
        if (res?.ok) { ok++; ackMs.push(Date.now() - t0); bump(perInstance, res.instanceId ?? "?"); instOf[i] ??= res.instanceId; }
        else { failed++; bump(ackErrors, res?.error ?? "unknown"); }
      });
  }, INTERVAL_MS)), Math.random() * INTERVAL_MS);                    // stagger so all users do not fire in the same millisecond
});

await sleep((WARMUP + DURATION) * 1000);
intervals.forEach(clearInterval);
await sleep(3000);                                      // let in-flight acks and deliveries arrive

console.log("\n==================== RESULT ====================");
console.log(`Users                  : ${USERS}  (peak connected: ${peak})`);
console.log(`Messages sent          : ${sent}`);
console.log(`  acked OK             : ${ok}  (${((ok / sent) * 100 || 0).toFixed(2)}%)`);
console.log(`  acked with error     : ${failed}  ${JSON.stringify(ackErrors)}`);
console.log(`  timed out (5s)       : ${timedOut}`);
console.log(`Delivered to receiver  : ${received}  (${((received / sent) * 100 || 0).toFixed(2)}% of sent)`);
console.log(`Ack latency (ms)       : p50 ${pct(ackMs, 0.5)}  p95 ${pct(ackMs, 0.95)}  p99 ${pct(ackMs, 0.99)}`);
console.log(`Delivery latency (ms)  : p50 ${pct(deliveryMs, 0.5)}  p95 ${pct(deliveryMs, 0.95)}  p99 ${pct(deliveryMs, 0.99)}`);
console.log(`Per instance (acks)    : ${JSON.stringify(perInstance)}`);
let cross = 0, pairs = 0;
for (let k = 0; k + 1 < USERS; k += 2) {
  if (instOf[k] !== undefined && instOf[k + 1] !== undefined) { pairs++; if (instOf[k] !== instOf[k + 1]) cross++; }
}
console.log(`Cross-instance pairs   : ${cross} of ${pairs} pairs (sender and receiver on different instances)`);
console.log(`Send rate (actual)     : ${(sent / DURATION).toFixed(0)} msg/s  (target ${((USERS * 1000) / INTERVAL_MS).toFixed(0)} msg/s)`);
console.log(`Load generator lag max : ${genLagMax} ms  (above ~200 ms the results are unreliable: the test client is overloaded)`);
console.log(`Connect errors         : ${JSON.stringify(connectErrors)}`);
console.log("================================================\n");
process.exit(0);