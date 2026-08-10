import express from 'express';
import { registerUser, loginUser, verifyOtp, resendOtp, getUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Private route (requires JWT)
router.get('/profile', protect, getUserProfile);

export default router;