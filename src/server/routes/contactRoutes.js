const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Please provide all details.' });
  }

  try {
    // Ye aapka email setup karega (Apne .env file ka EMAIL aur APP_PASSWORD use karega)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL, // Jo .env mein bhoomigupta8755@gmail.com hoga
        pass: process.env.APP_PASSWORD // Jo .env mein 16 character ka password hoga
      }
    });

    const mailOptions = {
      from: `HackHunt Contact <${process.env.EMAIL}>`,
      to: 'vanitripathi595@gmail.com', // Aapko is email pe message receive hoga
      replyTo: email, // Jab aap reply karenge, toh directly user ko jayega
      subject: `New HackHunt Inquiry: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #6d28d9;">New Message from HackHunt Contact Form</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #ccc; my-4;">
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">${message}</p>
        </div>
      `
    };

    // Email send kar do
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Thank you! Your message has been sent successfully.' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ error: 'Oops! Something went wrong. Please try again later.' });
  }
});

module.exports = router;