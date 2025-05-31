import express from "express"
import { comment, createPost, like } from "../controllers/postController.js";
import multer from "multer";

const router = express.Router();




const storage = multer.memoryStorage();
const upload = multer({
    storage: storage
})

router.post('/create', upload.array('photo'), createPost);
router.post('/comment', comment);
router.post('/like', like);


export default router