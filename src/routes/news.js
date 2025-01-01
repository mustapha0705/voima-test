import express from "express";
import {
  getAllNews,
  getSingleNews,
  createNews,
  updateNews,
  deleteNews,
} from "../controllers/newsController.js";
import authenticateUser from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllNews);

router.get("/:id", getSingleNews);

router.post("/", authenticateUser, createNews);

router.patch("/:id", authenticateUser, updateNews);

router.delete("/:id", authenticateUser, deleteNews);

export default router;
