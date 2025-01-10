import mongoose from "mongoose";
import { matchedData, validationResult } from "express-validator";
import Contact from "../models/contactModel.js";

const getMessages = async (req, res) => {
  try {
    const messages = await Contact.find({});

    if (messages.length === 0) {
      return res
        .status(404)
        .json({ msg: "There are no messages available at the moment" });
    }

    res.status(200).json({ nbHits: messages.length, messages });
  } catch (error) {
    console.error("Error fetching messages", error);
    return res.status(400).json({ msg: "Failed to fetch messages" });
  }
};

const getMessage = async (req, res) => {
  try {
    const { id: messageID } = req.params;

    if (!mongoose.isValidObjectId(messageID)) {
      return res.status(400).json({ msg: `Invalid ID format: ${messageID}` });
    }

    const message = await Contact.findById(messageID);

    if (!message) {
      return res
        .status(404)
        .json({ msg: `A message with the id of ${messageID} was not found` });
    }

    res.status(200).json({ message });
  } catch (error) {
    console.error(`Error fetching message with id ${messageID}`, error);
    return res.status(400).json({ msg: "Failed to fetch message" });
  }
};

const createMessage = async (req, res) => {
  try {
    if (!req.body.message || !req.body.name || !req.body.email) {
      return res
        .status(400)
        .json({ msg: "Please provide inputs for all fields" });
    }
    const data = {
      subject: req.body.message,
      name: req.body.name,
      email: req.body.email,
    };

    const message = await Contact.create(data);

    res.status(201).json({ msg: "Message sent sucessfully", message });
  } catch (error) {
    console.error(`Error creating message`, error);
    return res.status(400).json({ msg: "Failed to send message" });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id: messageID } = req.params;

    const message = await Contact.findByIdAndDelete(messageID);

    if (!message) {
      return res
        .status(404)
        .json({ msg: `A message with the id of ${messageID} was not found` });
    }

    res.status(200).json({ msg: "Message Deleted successfully!", message });
  } catch (error) {
    console.error(`Error deleting message with ID ${messageID}`, error);
    return res.status(400).json({ msg: "Failed to delete message" });
  }
};

export { createMessage, getMessages, getMessage, deleteMessage };
