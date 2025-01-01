import {
  getAllBlogs,
  getBlog,
  createBlog,
  deleteBlog,
  updateBlog,
} from "../controllers/blogController.js";
import authenticateUser from "../middleware/auth.js";
import express from "express";

const router = express.Router();

router.get("/", getAllBlogs);

router.get("/:id", getBlog);

router.post("/", authenticateUser, createBlog);

router.patch("/:id", authenticateUser, updateBlog);

router.delete("/:id", authenticateUser, deleteBlog);

export default router;
