import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
    try {
        // 1. Check karo session mein userId hai ya nahi
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: "Unauthorized: Please login first" });
        }

        // 2. Database mein check karo user zinda hai ya delete ho gaya
        // Password mat lana (-password)
        const user = await User.findById(req.session.userId).select("-password");

        if (!user) {
            req.session.destroy(); // Session saaf karo agar user nahi mila
            return res.status(401).json({ message: "User not found" });
        }

        // 3. User object ko request mein chipka do (Agge controller mein kaam aayega)
        req.user = user;
        
        next(); // Gate kholo, aage jane do
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ message: "Server Error in Auth Middleware" });
    }
};