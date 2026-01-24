// route the req for getting all the user and a specific user

import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getUsers, getUserById } from "../controllers/user.controller.js";

const router = express.Router();

// req for all the user
router.get('/',protect, getUsers);

// req for a specific user
router.get('/:id',protect, getUserById);


export default router