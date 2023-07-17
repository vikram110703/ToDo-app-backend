import express from "express";
import { getMyProfile, login, logout, register, resendEmail, verifyMail } from "../controllers/user.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/new", register);
router.post("/login", login);
router.get('/verify',verifyMail);
router.post('/resendConfirmationEmail',resendEmail);
router.get("/logout", logout);
router.get("/me", isAuthenticated, getMyProfile);
router.get("/", login);

export default router;
