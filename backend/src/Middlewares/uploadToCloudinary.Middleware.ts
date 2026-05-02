
import { Request, Response, NextFunction } from 'express';
import { uploadToCloudinary, deleteFromCloudinary } from '../Utils/cloudinary.Utils.js';


/**
 * Middleware to upload file to Cloudinary after Multer saves it locally
 * Works for user profile images
 */

export const uploadUserImageToCloudinary = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        
        // / Check if file exists
        if (!req.file) {
            return next();
        }

        // Only Process images
        if (!req.file.mimetype.startsWith('image/')) {
            res.status(400).json({
                success: false,
                message: 'Invalid file type. Only images are allowed.'
            });
            return;
        }

        const userId = req.user?._id || 'bootstrap';
        const timestamp = Date.now();
        const publicId = `user-${userId}-${timestamp}`;

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(
            req.file.path, // Local file path
            'whatsapp-campaign/users', // Folder
            publicId, // Custom name
            'image' // Resource type
        );

        // Replace file path with Cloudinary URL
        req.file.path = cloudinaryUrl;

        next();

    } catch (error: any) {
        console.error('Upload to Cloudinary middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image to cloud storage',
            error: error.message,
        });
    }
};

/**
 * Middleware to upload campaign files (images/videos/PDFs) to Cloudinary
 * VIDEOS AND PDFS ARE COMMENTED OUT FOR NOW
 */

export const uploadCampaignFileToCloudinary = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Check if file exists (from Multer)
        if (!req.file) {
            return next(); // No file uploaded, continue
        }

        const userId = req.user?._id || 'unknown';
        const timestamp = Date.now();
        const campaignName = req.body.campaignName?.replace(/\s+/g, '-').toLowerCase() || 'campaign';
        const publicId = `${campaignName}-${userId}-${timestamp}`;

        let cloudinaryUrl: string;
        let resourceType: 'image' | 'video' | 'raw';

        // Only images work for now
        if (req.file.mimetype.startsWith('image/')) {
            resourceType = 'image';
            cloudinaryUrl = await uploadToCloudinary(
                req.file.path,
                'whatsapp-campaign/campaigns',
                publicId,
                resourceType
            );
        } 
        // FUTURE: Video support (commented out)
        /*
        else if (req.file.mimetype.startsWith('video/')) {
            resourceType = 'video';
            cloudinaryUrl = await uploadToCloudinary(
                req.file.path,
                'whatsapp-campaign/campaigns',
                publicId,
                resourceType
            );
        } 
        */
        // FUTURE: PDF support (commented out)
        /*
        else if (req.file.mimetype === 'application/pdf') {
            resourceType = 'raw';
            cloudinaryUrl = await uploadToCloudinary(
                req.file.path,
                'whatsapp-campaign/campaigns',
                publicId,
                resourceType
            );
        } 
        */
        else {
            res.status(400).json({
                success: false,
                message: 'Only images are currently supported. Videos and PDFs coming soon!',
            });
            return;
        }

        // Replace file path with Cloudinary URL
        req.file.path = cloudinaryUrl;
        req.body.fileUrl = cloudinaryUrl;

        next();
    } catch (error: any) {
        console.error('Upload campaign file to Cloudinary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file to cloud storage',
            error: error.message,
        });
    }
};


/**
 * Helper to delete old image when updating user profile
 */
export const deleteOldUserImage = async (oldImageUrl: string): Promise<void> => {
    try {
        if (oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
            await deleteFromCloudinary(oldImageUrl, 'image');
        }
    } catch (error) {
        console.error('Error deleting old image:', error);
        // Don't throw - deletion failure shouldn't break the update
    }
};
