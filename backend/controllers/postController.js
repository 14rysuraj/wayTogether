import multer from "multer"
import { Post } from "../models/post.js";




export const createPost = async (req, res) => {
    try {
        const { userId, content } = req.body;

        
        const images = req.files
            ? req.files.map(file => file.buffer.toString('base64'))
            : [];

        const post = new Post({
            userId,
            content,
            images
        });

        const createdPost = await post.save();
        res.status(201).json(createdPost);
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const comment = async (req, res) => {
    try {
        const { username, text, postId } = req.body;

    
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

   
        post.comments.push({ username, text });

        await post.save();

        res.status(200).json({ message: "Comment added", post });
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const like = async (req, res) => {

    try {

        const { username, postId } = req.body;





        
    } catch (error) {
         console.log("error", error);
        res.status(500).json({ error: "Internal server error" });
    }
    
}