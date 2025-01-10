import mongoose from "mongoose";
import Blog from "../models/blogModel.js";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import multer from "multer";
import s3Client from "../config/connectS3Bucket.js";
import dotenv from "dotenv";
dotenv.config();
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const s3BucketName = process.env.S3_BUCKET_NAME;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const getAllBlogs = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const blogs = await Blog.find({}).skip(skip).limit(limit).lean();

    const totalBlogs = await Blog.estimatedDocumentCount();

    if (blogs.length === 0) {
      return res
        .status(404)
        .json({ msg: "There are no blogs available at the moment" });
    }

    for (const blog of blogs) {
      if (blog.imageName) {
        try {
          const getObjectParams = {
            Bucket: s3BucketName,
            Key: blog.imageName,
          };
          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });

          blog.imageUrl = url;
        } catch (error) {
          console.error("Error getting signed URL", error);
          blog.imageUrl = null;
        }
      }
    }

    res.status(200).json({
      nbHits: totalBlogs,
      totalPages: Math.ceil(totalBlogs / limit),
      currentPage: page,
      blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({ msg: "Failed to fetch blogs" });
  }
};

const getBlog = async (req, res) => {
  try {
    const { id: blogID } = req.params;

    if(!mongoose.isValidObjectId(blogID)){
      return res.status(400).json({ msg: `Invalid ID format: ${blogID}` })
    }
    
    const blog = await Blog.findById(blogID).lean();

    if (!blog) {
      return res
        .status(404)
        .json({ msg: `A blog with the id of ${blogID} was not found` });
    }

    let url = null;
    if (blog.imageName) {
      try {
        const params = {
          Bucket: s3BucketName,
          Key: blog.imageName,
        };

        const command = new GetObjectCommand(params);
        url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      } catch (error) {
        console.error(`error generating signed URL for blog ${blogID}:`, error);
        return res.status(500).json({ msg: "Failed to fetch image" });
      }
    }
    if (url) {
      blog.imageUrl = url;
    }

    res.status(200).json({ blog });
  } catch (error) {
    console.error("error fetching blog:", error);
    return res.status(500).json("Failed to fetch blog");
  }
};

const createBlog = [
  upload.single("blog_image"),
  async (req, res) => {
    try {
      if (!req.body.title || !req.body.content) {
        return res.status(400).json({ msg: "Title and content are required" });
      }
      let uniqueImageName = null;
      if (req.file) {
        uniqueImageName = `${Date.now()}-${req.file.originalname}`;

        try {
          const params = {
            Bucket: s3BucketName,
            Key: uniqueImageName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          };

          const command = new PutObjectCommand(params);
          await s3Client.send(command);
        } catch (error) {
          console.error("error uploading to s3 bucket", error);
          return res.status(500).json({ msg: "Failed to uplaod image" });
        }
      }
      const data = {
        title: req.body.title,
        content: req.body.content,
        author: req.body.author,
        ...(uniqueImageName && { imageName: uniqueImageName }),
      };

      const blog = await Blog.create(data);

      res.status(201).json({ msg: "Blog created successfully", blog });
    } catch (error) {
      console.error("error creating blog:", error);
      return res.status(500).json({ msg: "Failed to create blog" });
    }
  },
];

const deleteBlog = async (req, res) => {
  try {
    const { id: blogID } = req.params;
    const blog = await Blog.findById(blogID);

    if (!blog) {
      return res
        .status(404)
        .json({ msg: `A blog with the id of ${blogID} was not found` });
    }

    if (blog.imageName) {
      try {
        const params = {
          Bucket: s3BucketName,
          Key: blog.imageName,
        };

        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
      } catch (error) {
        console.error("Error deleting image from S3", error);
        return res.status(500).json({ msg: "Failed to delete image in blog" });
      }
    }

    await Blog.findByIdAndDelete(blogID);

    res.status(200).json({ msg: "blog deleted successfully", blog });
  } catch (error) {
    console.error("error deleting blog", error);
    return res.status(500).json({ msg: "Failed to delete blog" });
  }
};

const updateBlog = [
  upload.single("blog_image"),
  async (req, res) => {
    try {
      const { id: blogID } = req.params;
      const blog = await Blog.findById(blogID);

      if (!blog) {
        return res
          .status(404)
          .json({ msg: `A blog with the id of ${blogID} was not found` });
      }

      if (!blog.imageName && req.file) {
        console.log(
          `Blog with ID ${blogID} has no existing image. Uploading a new image.`
        );
      }

      let newImageName = blog.imageName;
      if (req.file) {
        newImageName = `${Date.now()}-${req.file.originalname}`;

        const uploadParams = {
          Bucket: s3BucketName,
          Key: newImageName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };

        try {
          const uploadCommand = new PutObjectCommand(uploadParams);
          await s3Client.send(uploadCommand);

          if (blog.imageName) {
            const deleteParams = {
              Bucket: s3BucketName,
              Key: blog.imageName,
            };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3Client.send(deleteCommand);
          }
        } catch (s3Error) {
          console.error(
            `Error uploading new image for blog with ID:${blogID}:`,
            s3Error
          );
          return res.status(500).json({ msg: "Failed to upload new image" });
        }
      }
      const { title, content, author } = req.body;

      const data = {
        title: title || blog.title,
        content: content || blog.content,
        author: author || blog.author,
        ...(req.file && { imageName: newImageName }),
      };

      const updatedBlog = await Blog.findByIdAndUpdate(blogID, data, {
        new: true,
      });

      res.status(200).json({ msg: "Blog updated successfully", updatedBlog });
    } catch (error) {
      console.error("error updating blog:", error);
      return res.status(500).json({ msg: "Failed to update blog" });
    }
  },
];

export { getAllBlogs, getBlog, createBlog, deleteBlog, updateBlog };
