import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
    // 1. Token Create Karo
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15d", // 15 din tak valid
    });

    // 2. Cookie mein set karo
    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // MS mein time
        httpOnly: true, // XSS protection (JavaScript access nahi kar payega)
        sameSite: "strict", // CSRF protection
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
    });
};

export default generateTokenAndSetCookie;