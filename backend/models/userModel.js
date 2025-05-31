import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,  
        minlength:[6,"password must be greater that 6 chracter"],
        required: true,
    },
    profile: {
        type: String,
        default: "",
    },
  
 
}


)

const User = mongoose.model('User', userSchema)

export default User;

