import News from "../models/newsModel.js";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();
import s3Client from "../config/connectS3Bucket.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const s3BucketName = process.env.S3_BUCKET_NAME;

const getAllNews = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const news = await News.find({}).skip(skip).limit(limit).lean();

    const totalNews = await News.estimatedDocumentCount();

    if (news.length === 0) {
      return res
        .status(404)
        .json({ msg: "There are no news available at the moment" });
    }

    for (const newsItem of news) {
      if (newsItem.imageName) {
        try {
          const getObjectParams = {
            Bucket: s3BucketName,
            Key: newsItem.imageName,
          };
          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });

          newsItem.imageUrl = url;
        } catch (error) {
          console.error("Error getting signed URL", error);
          newsItem.imageUrl = null;
        }
      }
    }

    res.status(200).json({
      nbHits: totalNews,
      totalPages: Math.ceil(totalNews / limit),
      currentPage: page,
      news,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return res.status(500).json({ msg: "Failed to Fetch news" });
  }
};

const getSingleNews = async (req, res) => {
  try {
    const { id: newsID } = req.params;
    const newsItem = await News.findById(newsID).lean();

    if (!newsItem) {
      return res
        .status(404)
        .json({ msg: `A newsItem with the ID of ${newsID} was not found` });
    }

    let url = null;
    if (newsItem.imageName) {
      try {
        const getObjectParams = {
          Bucket: s3BucketName,
          Key: newsItem.imageName,
        };

        const command = new GetObjectCommand(getObjectParams);
        url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      } catch (error) {
        console.error(`Error getting signedUrl for blog ${newsID}`, error);
        return res.status(500).json({ msg: "Failed to fetch Image" });
      }
    }
    if (url) {
      newsItem.imageUrl = url;
    }

    res.status(200).json({ newsItem });
  } catch (error) {
    console.error("Error fetching newsItem", error);
    return res.status(500).json({ msg: "Failed to fetch newsItem" });
  }
};

const createNews = [
  upload.single("news_image"),
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
          console.error("error uploading to s3 bucket:", error);
          return res.status(500).json({ msg: "Failed to uplaod image" });
        }
      }
      const data = {
        title: req.body.title,
        content: req.body.content,
        author: req.body.author,
        ...(uniqueImageName && { imageName: uniqueImageName }),
      };

      const news = await News.create(data);

      res.status(201).json({ msg: "News created successfully", news });
    } catch (error) {
      console.error("Error creating news:", error);
      return res.status(500).json({ msg: "Failed to create News" });
    }
  },
];

const updateNews = [
  upload.single("news_image"),
  async (req, res) => {
    try {
      const { id: newsID } = req.params;
      const newsItem = await News.findById(newsID);

      if (!newsItem) {
        return res
          .status(404)
          .json({ msg: `A news item with the ID of ${newsID} was not found` });
      }

      if (!newsItem.imageName && req.file) {
        console.log(
          `News Item with ID ${newsID} has no existing image. Uploading a new image.....`
        );
      }

      let newImageName = newsItem.imageName;
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

          if (newsItem.imageName) {
            const deleteParams = {
              Bucket: s3BucketName,
              Key: newsItem.imageName,
            };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3Client.send(deleteCommand);
          }
        } catch (s3Error) {
          console.error(
            `Error uploading new image for news with ID:${blogID}:`,
            s3Error
          );
          return res.status(500).json({ msg: "Failed to upload new image" });
        }
      }
      const { title, content, author } = req.body;

      const data = {
        title: title || newsItem.title,
        content: content || newsItem.content,
        author: author || newsItem.author,
        ...(req.file && { imageName: newImageName }),
      };

      const updatedNews = await News.findByIdAndUpdate(newsID, data, {
        new: true,
      });

      res
        .status(200)
        .json({ msg: "News item updated successfully", updatedNews });
    } catch (error) {
      console.error("Error updating news:", error);
      return res.status(500).json({ msg: "Failed to update news item" });
    }
  },
];

const deleteNews = async (req, res) => {
  try {
    const { id: newsID } = req.params;
    const newsItem = await News.findById(newsID);

    if (!newsItem) {
      return res
        .status(404)
        .json({ msg: `A newsItem with the ID of ${newsID} was not found` });
    }

    if (newsItem.imageName) {
      try {
        const params = {
          Bucket: s3BucketName,
          Key: newsItem.imageName,
        };

        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
      } catch (error) {
        console.error("Error deleting image from S3", error);
        return res.status(500).json({ msg: "Failed to delete newsItem Image" });
      }
    }

    await News.findByIdAndDelete(newsID);

    res.status(200).json({ msg: "newsItem deleted successfully", newsItem });
  } catch (error) {
    console.error("error deleting news", error);
    return res.status(500).json({ msg: "Failed to delete newsIten" });
  }
};

export { getAllNews, getSingleNews, createNews, updateNews, deleteNews };
