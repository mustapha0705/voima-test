import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    imageName: {
      type: String,
    },
    author: {
      type: String,
      trim: true,
      default: "Admin",
    },
  },
  { timestamps: true }
);

const blogModel = mongoose.model("Blog", blogSchema);

export default blogModel;
