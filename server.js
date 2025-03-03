require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");

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

// 📩 Email Sending Route
app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVER_EMAIL,
    subject: `New Contact Message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  };

  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Thank you for contacting us!",
    text: `Hi ${name},\n\nWe have received your message and will get back to you soon!\n\nYour Message:\n"${message}"\n\nBest Regards,\n[IYONICORP 🥰]`
  };

  try {
    await transporter.sendMail(adminMailOptions); // Send email to admin
    await transporter.sendMail(userMailOptions);  // Send confirmation to user
    res.json({ success: true, message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.json({ success: false, message: "Error sending email" });
  }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
