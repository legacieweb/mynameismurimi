require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet"); // Secure Headers
const rateLimit = require("express-rate-limit"); // Block Brute Force
const xssClean = require("xss-clean"); // Prevent XSS Attacks
const mongoSanitize = require("express-mongo-sanitize"); // Prevent NoSQL Injection
const hpp = require("hpp"); // HTTP Parameter Pollution Protection



const app = express();
app.use(bodyParser.json());

// 🛡 Secure Headers
app.use(helmet());

// 🌍 Enable CORS (Restrict Allowed Domains)
app.use(cors({
  origin: ["https://iyonicorp.com", "https://www.iyonicorp.com", "https://info.iyonicorp.com", "null"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 🚀 Rate Limiting (Prevent Brute Force Attacks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "🚨 Too many requests! Please try again later."
});
app.use(limiter);

// ❌ Prevent XSS Attacks
app.use(xssClean());

// 🔒 Prevent NoSQL Injection & Sanitize Data
app.use(mongoSanitize());


// 🚀 Email Rate Limiting (Prevent Spam)
const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 email requests per 10 minutes
  message: "🚨 Too many emails sent! Please try again later.",
});

// Contact form delivery stays server-side; the static page calls this same-origin function.
const sendContactEmail = require("./services/iyonicmailer");
app.post("/send-email", emailLimiter, sendContactEmail);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://images.iyonicorp.com"],
      connectSrc: ["'self'", "https://api.iyonicorp.com"],
      frameAncestors: ["'none'"], // Prevent Clickjacking
    },
  })
);

// Serve the company guide from the same origin as its contact endpoint.
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.use("/assets", express.static(path.join(__dirname, "assets"), { index: false }));
app.use("/products", express.static(path.join(__dirname, "products"), { index: false }));

// Start the server
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
