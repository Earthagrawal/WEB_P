require("dotenv").config();

const nodemailer = require("nodemailer");

async function test() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: "24ucs074@lnmiit.ac.in",
    subject: "SMTP Working",
    text: "Mailtrap SMTP is working successfully",
  });

  console.log("Email sent:", info.messageId);
}

test().catch(console.error);