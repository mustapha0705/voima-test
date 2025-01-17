import express from "express";
import routeNotFound from "./middleware/routeNotFound.js";
import news from "./routes/news.js";
import blog from "./routes/blog.js";
import contact from "./routes/contact.js";
import subscribe from "./routes/subscription.js";
import auth from "./routes/authentication.js";
import connectDB from "./config/connectDB.js";
import dotenv from "dotenv";
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

// security  packages
import cors from "cors";
import helmet from "helmet";
import xss from "xss-clean";
import rateLimiter from "express-rate-limit";

const app = express();

//body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  })
);
app.use(
  cors({
    origin: "*"
    // [
    //   "http://localhost:5173",
    //   "https://voima-dev.vercel.app",
    //   "https://voimainitiative.org",
    // ]
    ,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(helmet());
app.use(xss());

//create default route
app.get("/", (req, res) => {
  res.status(200).json({ msg: "API working perfectly" });
});

//news route
app.use("/api/v1/news", news);

//blog route
app.use("/api/v1/blog", blog);

//contact route
app.use("/api/v1/contact", contact);

//subscription route
app.use("/api/v1/subscribe", subscribe);

app.use("/api/v1/auth", auth);

//invalid route middleware
app.use(routeNotFound);

//start node server
const start = async () => {
  try {
    await connectDB(MONGO_URI);
    app.listen(PORT, () => {
      console.log(
        `Server running at address http://localhost:${PORT} and successfully connected to database`
      );
    });
  } catch (error) {
    console.error(
      "Error starting the server or connecting to the database:",
      error
    );
  }
};

start();
