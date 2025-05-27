import mongoose from "mongoose";

const userSchema=mongoose.Schema({
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
        required: true,
    },
    image: {
        type: String,
        default: "",
    },
    is_online: {
        type: String,
        default:'0',
    },
 
}, {
    timestamps: true,
}

)

const User = mongoose.model('User', userSchema)

export default User;

