import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import generateTokenAndSetCookie from "../utils/generateToken.js"; // <--- Import

export const signup = async (req, res) => {
    try {
        const { name, password } = req.body;
        const existingUser = await User.findOne({ name });
        if (existingUser) return res.status(400).json({ message: "User exists" });
    
        const newUser = new User({ name, password });
        await newUser.save();
        console.log("New User Created", newUser);

        // --- JWT LOGIC START ---
        // Signup ke turant baad login karwa do
        generateTokenAndSetCookie(newUser._id, res);
        // --- JWT LOGIC END ---

        res.status(201).json({
            message: "User created",
            user: { _id: newUser._id, name: newUser.name }
        });
    } catch (error) {
        console.log("Signup Error", error);
        res.status(500).json({ error: "Server Error" });
    }
};

export const login = async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await User.findOne({ name }).select("+password");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // --- JWT LOGIC START ---
        // Session ki jagah bas ye function call karna hai
        generateTokenAndSetCookie(user._id, res);
        // --- JWT LOGIC END ---

        res.status(200).json({
            message: "Logged in successfully",
            user: { _id: user._id, name: user.name }
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