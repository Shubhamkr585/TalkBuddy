import express from "express";
import {signup,login} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { getProfile } from "../controllers/auth.controller.js";


const router = express.Router();

router.post("/signup",signup);

router.post("/login",login);
router.get("/me", protect, getProfile);

export default router; 