import express from 'express';
import { Registration, Login, Logout, updateProfile, BootstrapStatus, BootstrapAdmin } from '../Controllers/auth.Controller.js';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import upload from '../Utils/upload.Utils.js';
import { uploadUserImageToCloudinary } from '../Middlewares/uploadToCloudinary.Middleware.js';


const router = express.Router();

router.post('/register', upload.single('image'), Registration);
router.post('/login', upload.none(), Login);
router.get('/bootstrap-status', BootstrapStatus);
router.post('/bootstrap-admin', upload.single('image'), uploadUserImageToCloudinary, BootstrapAdmin);
router.post('/logout', isLoggedIn, Logout);
router.put('/update-profile', isLoggedIn, upload.single('image'), uploadUserImageToCloudinary, updateProfile);

export default router;
