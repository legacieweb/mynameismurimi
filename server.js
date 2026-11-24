require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet"); // Secure Headers
const rateLimit = require("express-rate-limit"); // Block Brute Force
const xssClean = require("xss-clean"); // Prevent XSS Attacks
const mongoSanitize = require("express-mongo-sanitize"); // Prevent NoSQL Injection
const hpp = require("hpp"); // HTTP Parameter Pollution Protection



const app = express();
app.use(cors());
app.use(bodyParser.json());

// 📧 NodeMailer Setup
const transporter = nodemailer.createTransport({
  service: "gmail",  // Change if using another service
  auth: {
    user: process.env.EMAIL_USER,  // Use .env file for security
    pass: process.env.EMAIL_PASS
  }
});

// 🛡 Secure Headers
app.use(helmet());

// 🌍 Enable CORS (Restrict Allowed Domains)
app.use(cors({
  origin: ["https://www.iyonicorp.com"], // Replace with your domain
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

const validator = require("validator"); // For Email Validation

// 🚀 Email Rate Limiting (Prevent Spam)
const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 email requests per 10 minutes
  message: "🚨 Too many emails sent! Please try again later.",
});

// 📩 Secure Email Sending Route
app.post("/send-email", emailLimiter, async (req, res) => {
  try {
    let { name, email, message } = req.body;

    // 🛡 Validate Inputs (Prevent XSS & Injection)
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "❌ All fields are required!" });
    }

    name = name.trim().replace(/<[^>]*>?/gm, ""); // Remove HTML tags
    email = email.trim();
    message = message.trim().replace(/<[^>]*>?/gm, ""); // Remove HTML tags

    // ✅ Validate Email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "❌ Invalid email format!" });
    }

    // 🔐 Prevent SQL Injection (Sanitize Inputs)
    if (/[$'";]/.test(name) || /[$'";]/.test(message)) {
      return res.status(400).json({ success: false, message: "❌ Invalid input detected!" });
    }

    // ✉️ Email Configuration
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Contact Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting us! 😊",
      text: `Hi ${name},\n\nWe have received your message and will get back to you soon!\n\nYour Message:\n"${message}"\n\nBest Regards,\nIYONICORP Team 🥰`
    };

    // 📩 Send Emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    res.json({ success: true, message: "✅ Emails sent successfully!" });

  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "❌ Internal Server Error. Please try again later." });
  }
});

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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
