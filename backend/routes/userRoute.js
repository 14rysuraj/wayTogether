import express from 'express';
import { getProfile, login, logout, signup, getUserById, updateProfile, getUserTrips, updateProfileImage} from '../controllers/userController.js';
import { verifyOtp } from '../helper/verifyOTP.js';
import { googleAuth } from '../helper/googleAuth.js';
import { isAuthenticated } from '../middlewares/auth.js';
import multer from "multer";


const router = express.Router();



const storage = multer.memoryStorage();
const upload = multer({
    storage: storage
})

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/verify-otp', verifyOtp);
router.post('/google-auth', googleAuth); 
router.get('/profile', isAuthenticated, getProfile);
router.put('/updateProfile', isAuthenticated, updateProfile);
router.get('/userTrips', isAuthenticated, getUserTrips);
router.get('/user/:userId', isAuthenticated, getUserById);
router.post('/updateProfileImage',upload.single('image'),isAuthenticated,updateProfileImage)

export default router