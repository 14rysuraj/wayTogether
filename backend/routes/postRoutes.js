import express from "express"
import { allPosts, comment, createPost, like, deletePost, updatePost } from "../controllers/postController.js";
import multer from "multer";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();




const storage = multer.memoryStorage();
const upload = multer({
    storage: storage
})

router.post('/create', upload.array('photo'),isAuthenticated, createPost);
router.post('/comment',isAuthenticated, comment);
router.post('/like',isAuthenticated, like);
router.get('/allPost',isAuthenticated,allPosts);
router.delete('/deletePost/:postId',isAuthenticated,deletePost);
router.put('/updatePost/:postId',isAuthenticated,updatePost);


export default router