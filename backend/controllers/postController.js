import multer from "multer"
import { Post } from "../models/post.js";




export const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user._id;

        
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
        const { text, postId } = req.body;
        const userId = req.user._id
        const name=req.user._name

    
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

   
        post.comments.push({userId , text,name });

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

export const allPosts = async (req, res) => {
    

let post = await Post.find().populate('userId')
    
  
post= post.reverse();

    
    
    if (!post) {
        return res.status(404).json({
            success: false,
            message: "Post Not Found",
        })
    }

    res.status(200).json({
        success: true,
        post,
    })


}

export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        // Find the post
        const post = await Post.findById(postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Check if the user is the creator of the post
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own posts"
            });
        }

        // Delete the post
        await Post.findByIdAndDelete(postId);

        res.status(200).json({
            success: true,
            message: "Post deleted successfully"
        });
        
    } catch (error) {
        console.log("Error deleting post:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        // Find the post
        const post = await Post.findById(postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Check if the user is the creator of the post
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only edit your own posts"
            });
        }

        // Update the post
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { content },
            { new: true }
        ).populate('userId');

        res.status(200).json({
            success: true,
            message: "Post updated successfully",
            post: updatedPost
        });
        
    } catch (error) {
        console.log("Error updating post:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}