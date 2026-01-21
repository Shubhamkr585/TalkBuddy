import User from "../models/user.model.js";
import bcrypt from "bcrypt";

// Signup Logic
const signup = async (req, res) => {
    try {
        const { name, password } = req.body;
        
        // Check existing
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user (Password hashing model ke pre-hook mein hogi)
        const newUser = new User({ name, password });
        await newUser.save(); // Save hote hi _id mil jayegi

        // Response ke liye password hatao
        const userResponse = newUser.toObject();
        delete userResponse.password;
        
        return res.status(201).json({
            message: "User created successfully",
            user: userResponse,
        });

    } catch (error) { 
        console.log("Signup Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Login Logic (Aapka logic sahi tha, bas error handling refine ki hai)
const login = async (req, res) => {
    try {
        const { name, password } = req.body;

        const user = await User.findOne({ name }).select("+password");

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Session Create
        req.session.userId = user._id;

        // Prepare Response
        const userResponse = user.toObject(); 
        delete userResponse.password; 

        return res.status(200).json({ 
            message: "Logged in successfully", 
            user: userResponse 
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


const getProfile = async (req, res) => {
    try {
        // Humne middleware (protect) mein req.user pehle hi set kar diya tha.
        // Dobara DB call karne ki zaroorat nahi hai!
        const user = req.user;

        return res.status(200).json({
            message: "User profile fetched successfully",
            user: user,
        });
    } catch (error) {
        console.error("Profile Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export { signup, login, getProfile};