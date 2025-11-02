import nodemailer from "nodemailer";
import type { Request, Response } from "express";

export const supportForm = async (req: Request, res: Response) => {
  try {
    const { name, subject, message, email, number } = req.body;

    if (!name || !subject || !message || !email || !number) {
      return res.status(400).json({
        success: false,
        message: "Name, email, subject, message, and number are required.",
      });
    }

    // ✅ 1. Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ 2. Send mail to ADMIN (you)
    const adminMailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.EMAIL_RECEIVER,
      subject: subject || "New Support Request",
      html: `
        <h2>📩 New Support Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Number:</strong> ${number}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `,
    };

    await transporter.sendMail(adminMailOptions);

    // ✅ 3. Send Auto-Reply to USER
    const userMailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank you for contacting our support team",
      html: `
        <h3>Hi ${name},</h3>
        <p>Thank you for reaching out to our support team. 🙏</p>
        <p>We’ve received your message and will get back to you as soon as possible.</p>
        <br/>
        <p>— The Support Team</p>
      `,
    };

    await transporter.sendMail(userMailOptions);

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("❌ Error in supportForm controller:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while sending your message. Please try again later.",
    });
  }
};
