const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,     // .env se email uthayega
        pass: process.env.PASSWORD,  // .env se app password uthayega
      },
    });

    const mailOptions = {
      from: `"HackHunt Support" <${process.env.EMAIL}>`, 
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ NODEMAILER: Email successfully sent!");

  } catch (error) {
    console.error("❌ NODEMAILER ERROR:", error.message);
    throw error; 
  }
};

module.exports = sendEmail;