import express from "express";
import {
  deleteSubscriber,
  getSubscribers,
  createSubscriber,
} from "../controllers/subscriptionController.js";
import authenticateUser from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateUser, getSubscribers);
router.post("/", createSubscriber);
router.delete("/:id", authenticateUser, deleteSubscriber);

export default router;
