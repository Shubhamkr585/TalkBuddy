import { io } from "socket.io-client";
import crypto from "crypto";

const TARGET_URL = "http://localhost:8080";
const CONCURRENT_USERS = 100;
const MSG_RATE_PER_SEC_PER_USER = 1; // 1 msg per second per user
const DURATION_SEC = 30; // run for 30s

let activeSockets = 0;
let messagesSent = 0;
let messagesAcked = 0;
let totalLatency = 0;
const latencies = [];

console.log(`🚀 Starting load test: ${CONCURRENT_USERS} users...`);

const run = async () => {
  const sockets = [];

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const userId = `testuser_${i}`;
    const socket = io(TARGET_URL, {
      transports: ["websocket"],
      extraHeaders: {
        "x-user-id": userId,
        "Origin": "http://localhost:3000"
      }
    });

    socket.on("connect", () => {
      activeSockets++;
    });

    socket.on("connect_error", (err) => {
      console.log(`Connection Error: ${err.message}`, err);
    });

    socket.on("disconnect", () => {
      activeSockets--;
    });

    sockets.push({ socket, userId });
    
    // Stagger connections
    await new Promise(r => setTimeout(r, 10));
  }

  console.log(`✅ All sockets connecting. Waiting 3s to stabilize...`);
  await new Promise(r => setTimeout(r, 3000));
  console.log(`📊 Active Sockets: ${activeSockets}`);

  console.log(`🔥 Starting message storm...`);
  const endTime = Date.now() + (DURATION_SEC * 1000);
  
  const stormInterval = setInterval(() => {
    sockets.forEach(({ socket, userId }) => {
      if (socket.connected) {
        const start = Date.now();
        messagesSent++;
        
        socket.emit("message:send", {
          receiverId: "target_user_id", // Some dummy target
          text: `Load test message from ${userId}`,
          clientMsgId: crypto.randomUUID()
        }, (ack) => {
          const latency = Date.now() - start;
          latencies.push(latency);
          totalLatency += latency;
          messagesAcked++;
        });
      }
    });
  }, 1000 / MSG_RATE_PER_SEC_PER_USER);

  await new Promise(r => setTimeout(r, DURATION_SEC * 1000));
  
  clearInterval(stormInterval);
  
  // Calculate p95
  latencies.sort((a, b) => a - b);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95 = latencies[p95Index] || 0;
  const avg = (totalLatency / latencies.length) || 0;

  console.log(`\n========================================`);
  console.log(`🛑 Load Test Completed`);
  console.log(`========================================`);
  console.log(`Total Connections Simulated : ${CONCURRENT_USERS}`);
  console.log(`Total Messages Sent         : ${messagesSent}`);
  console.log(`Total Messages Acked        : ${messagesAcked}`);
  console.log(`Average Latency             : ${avg.toFixed(2)} ms`);
  console.log(`p95 Latency                 : ${p95} ms`);
  console.log(`========================================\n`);

  process.exit(0);
};

run();
