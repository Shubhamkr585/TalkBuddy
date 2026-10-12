import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from 'cors'

const app = express();



app.use(cors({
    origin: "http://localhost:3000", // Aapka frontend URL
    credentials: true // Agar cookies/tokens bhej rahe ho
}));

const routes = {
    "/api/auth": "http://auth-backend:4000/auth",
    "/api/users": "http://auth-backend:4000/users",
    "/api/messages": "http://chat-1:5000/api/messages"
};


for (const route in routes) {
    const target = routes[route];
    app.use(route, createProxyMiddleware({ target: target, changeOrigin: true }));
}

const PORT = 5100;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
