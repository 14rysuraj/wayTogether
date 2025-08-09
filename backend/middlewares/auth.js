

import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {
    try {
        // Check for token in cookies first, then in Authorization header
        let token = req.cookies.token;
        
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Login First",
            });
        }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded._id);
            next();
        
    } catch (error) {
        
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}