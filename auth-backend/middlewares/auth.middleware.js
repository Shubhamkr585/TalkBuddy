import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

export const protect = async (req, res, next) => {
    try {
        // 1. Cookie se token nikalo
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token Provided" });
        }

        // 2. Token Verify Karo (Kya signature sahi hai?)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }

        // 3. User dhoondo (Decoded payload mein userId hai)
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true, createdAt: true, updatedAt: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user;
        next();

    } catch (error) {
        console.log("Middleware Error", error.message);
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
             return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }
        res.status(500).json({ message: "Server Error" });
    }
};