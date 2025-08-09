
import mongoose from "mongoose";




const commentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required:true
    },
    name: {
        type:String
    },
    text: {
        type: String,
        required:true
    },
    createdAt: {
        type: Date,
        default:Date.now
    }
})


const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    },
    content: {
        type:String,
    },
    images:[ {
        type:String
    }],
    comments: [commentSchema],

    likes: [
        {
            type:String
        }
    ],

    createdAt: {
        type: Date,
        default:Date.now
    }
        
    




})

export const Post = new mongoose.model("Post", postSchema);