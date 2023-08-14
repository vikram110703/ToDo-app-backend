import express from "express";
import { forgotPassword, getMyProfile, login, logout, register, resendEmail, resetPassword, verifyMail } from "../controllers/user.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/new", register);
router.post("/login", login);
router.get('/verify',verifyMail);
router.post('/resendConfirmationEmail',resendEmail);
router.get("/logout", logout);
router.get("/me", isAuthenticated, getMyProfile);
router.post('/forgotPassword',forgotPassword);
router.put('/resetpassword/:token',resetPassword);
router.get("/", login);

export default router;
