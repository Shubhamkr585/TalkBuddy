import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
dotenv.config();

export const sessionConfig = session({
    name: 'talkbuddy_sid', // Generic naam se better custom naam
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false, // Login karne par hi session banega
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions', // Alag collection banega DB mein
        ttl: 14 * 24 * 60 * 60 // 14 days expiration (Optional setting)
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 din
        httpOnly: true, // Javascript access block (Security)
        // Production (HTTPS) par true, Localhost (HTTP) par false
        secure: process.env.NODE_ENV === "production", 
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax' // Cross-site cookie handling
    }
});