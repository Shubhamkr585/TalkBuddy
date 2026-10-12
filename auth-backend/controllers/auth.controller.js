import prisma from "../prismaClient.js";
import bcrypt from "bcrypt";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
    try {
        const { name, password } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { name } });
        if (existingUser) return res.status(400).json({ message: "User exists" });
    
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                name,
                password: hashedPassword
            }
        });
        console.log("New User Created", newUser);

        generateTokenAndSetCookie(newUser.id, res);

        res.status(201).json({
            message: "User created",
            user: { _id: newUser.id, name: newUser.name }
        });
    } catch (error) {
        console.log("Signup Error", error);
        res.status(500).json({ error: "Server Error" });
    }
};

export const login = async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await prisma.user.findUnique({ where: { name } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        generateTokenAndSetCookie(user.id, res);

        res.status(200).json({
            message: "Logged in successfully",
            user: { _id: user.id, name: user.name }
        });
    } catch (error) {
        console.log("Login Error", error);
        res.status(500).json({ error: "Server Error" });
    }
};

export const logout = (req, res) => {
    // Cookie ki life 0 kar do (Delete)
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
};

export const getProfile = async (req, res) => {
    // Middleware ne user set kar diya hoga
    res.status(200).json(req.user);
};

export const verify = (req, res) => {
  try {
    const { userId } = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
    res.set("X-User-Id", String(userId));
    return res.sendStatus(200);
  } catch { return res.sendStatus(401); }
};