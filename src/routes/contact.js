import express from "express";
import {
  getMessage,
  getMessages,
  createMessage,
  deleteMessage,
} from "../controllers/contactController.js";
import authenticateUser from "../middleware/auth.js";

const router = express.Router();

router.post("/", createMessage);
router.get("/", authenticateUser, getMessages);
router.get("/:id", authenticateUser, getMessage);
router.delete("/:id", authenticateUser, deleteMessage);

export default router;
