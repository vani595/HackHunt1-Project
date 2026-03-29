const express = require("express");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// Contact form submission
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    // Prepare email content
    const emailContent = `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `;

    // Send email to the contact email
    const emailResult = await sendEmail({
      email: "bhoomigupta8755@gmail.com", // The contact email from the form
      subject: `Contact Form: ${subject}`,
      message: emailContent
    });

    if (!emailResult.skipped) {
      res.status(200).json({
        message: "Your message has been sent successfully!"
      });
    } else {
      res.status(500).json({
        message: "Email service is not configured. Please try again later."
      });
    }
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      message: "An error occurred. Please try again later."
    });
  }
});

module.exports = router;