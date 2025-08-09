import User from "../models/userModel.js";
import Trip from "../models/Trip.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

import { sendVerificationEmail } from "../helper/sendVerificationEmail.js";







export const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        let user = await User.findOne({ email });

        if (user) {
    if (!user.isVerified) {
       
     await sendVerificationEmail(user.email, user.otp);
        return res.status(200).json({
            success: false,
            error: "Email registered but not verified. Please check your email for OTP.",
            unverified: true
        });
    }
    return res.status(200).json({
        success: false,
        error: "User already exists",
    });
}
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now

        // Create new user with OTP fields
        user = await User.create({
            email,
            password: hashedPassword,
            name,
            isVerified: false,
            otp,
            otpExpires,
        });

        // Send OTP via email
        await sendVerificationEmail(user.email, otp);

        return res.status(201).json({
            success: true,
            message: "Signup successful! OTP sent to your email.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};





export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(200).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(200).json({ success: false, message: "Invalid credentials" });
    }
      
    if (!user.isVerified) {
    return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in.",
    });
}

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

  res.cookie("token", token, {
  httpOnly: true,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async(req, res) => {


    try {
        res
        .cookie("token", "", {
          expires: new Date(Date.now()),
        })
        .json({
          success: true,
          message: "Log out successfully",
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
   
};
  
export const getProfile = async (req, res) => {
  
  try {

    const user = req.user;
    if(!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        profile:user.profile
      },
    });
    
  }catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId).select('-password -otp -otpExpires');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get trip statistics
    const completedTrips = await Trip.countDocuments({
      'riders._id': userId,
      status: 'completed'
    });

    const createdTrips = await Trip.countDocuments({
      createdBy: userId,
    });

    const totalTrips = await Trip.countDocuments({
      'riders._id': userId
    });
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        profile:user.profile,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        tripStats: {
          completedTrips,
          createdTrips,
          totalTrips
        }
      },
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpires');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVerified: updatedUser.isVerified,
      },
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getUserTrips = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get all trips where user is a rider
    const trips = await Trip.find({
      'riders._id': user._id
    }).sort({ startDate: -1 }).limit(20); // Get last 20 trips

    res.status(200).json({
      success: true,
      trips: trips.map(trip => ({
        _id: trip._id,
        name: trip.name,
        status: trip.status,
        startDate: trip.startDate,
        endDate: trip.endDate,
        location: trip.location,
        riders: trip.riders.length,
        createdBy: trip.createdBy
      }))
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


export const updateProfileImage = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Convert buffer to base64 if you still want to store it that way
    const base64Image = req.file.buffer.toString("base64");
    user.profile = base64Image;
    await user.save();

    res.json({ success: true, message: "Profile image updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};