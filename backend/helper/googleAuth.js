import User from "../models/userModel.js";
import jwt from 'jsonwebtoken';

export const googleAuth = async (req, res) => {
  const { email, name } = req.body;
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      name,
      isVerified: true, 
    });
  }

  
const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

  return res.status(200).json({ success: true, user, token });
};