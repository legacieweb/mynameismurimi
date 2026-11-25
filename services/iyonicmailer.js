const validator = require("validator");
const MAILER_ENDPOINT = "https://api.iyonicorp.com/api/mailer/v1/send";
const COMPANY_INBOX = "iyonicorp@gmail.com";

async function sendViaIyonicMailer(apiKey, to, subject, text) {
  return fetch(MAILER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ to, subject, text })
  });
}

module.exports = async function sendContactEmail(req, res) {
  const { name, email, message, inquiryType, website } = req.body || {};
  if (website) return res.json({ success: true, confirmationSent: false });
  if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string" ||
      name.trim().length < 1 || name.length > 120 || message.trim().length < 1 || message.length > 5000 ||
      !validator.isEmail(email.trim()) || !["general", "investor"].includes(inquiryType)) {
    return res.status(400).json({ success: false, message: "Please check the form fields and try again." });
  }

  const apiKey = process.env.IYONIC_MAILER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ success: false, message: "The message service is not configured yet. Please email iyonicorp@gmail.com." });
  }

  const subject = inquiryType === "investor" ? "Website investor relations enquiry" : "Website contact enquiry";
  const senderEmail = email.trim();
  const senderName = name.trim();
  const senderMessage = message.trim();
  const companyText = `Name: ${senderName}\nEmail: ${senderEmail}\nCategory: ${inquiryType === "investor" ? "Investor relations" : "General enquiry"}\n\n${senderMessage}`;

  let companyResponse;
  try {
    companyResponse = await sendViaIyonicMailer(apiKey, COMPANY_INBOX, subject, companyText);
  } catch (error) {
    console.error("IyonicMailer contact delivery failed:", error.message);
    return res.status(502).json({ success: false, message: "We couldn’t send your message. Please try again or email us directly." });
  }
  if (!companyResponse.ok) {
    console.error("IyonicMailer rejected contact message with status:", companyResponse.status);
    return res.status(502).json({ success: false, message: "We couldn’t send your message. Please try again or email us directly." });
  }

  const confirmationText = `Hello ${senderName},\n\nWe received your ${inquiryType === "investor" ? "investor relations enquiry" : "message"} for Iyonicorp. The team will review it and follow up.\n\nYour message:\n${senderMessage}\n\nIyonicorp\nNairobi, Kenya`;
  let confirmationSent = false;
  try {
    const confirmation = await sendViaIyonicMailer(
      apiKey,
      senderEmail,
      "We received your message — Iyonicorp",
      confirmationText
    );
    confirmationSent = confirmation.ok;
    if (!confirmationSent) {
      console.error("IyonicMailer sender confirmation rejected with status:", confirmation.status);
    }
  } catch (error) {
    console.error("IyonicMailer sender confirmation failed:", error.message);
  }

  return res.status(202).json({ success: true, confirmationSent });
};
