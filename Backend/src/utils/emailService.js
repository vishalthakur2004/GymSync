import nodemailer from "nodemailer";

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: "gmail", // You can change this to other email services
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your email password or app password
    },
  });
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"GymSync" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "GymSync - Email Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #4f46e5; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 5px; }
            .footer { margin-top: 20px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ GymSync</h1>
              <h2>Email Verification</h2>
            </div>
            <div class="content">
              <h3>Hello ${name}!</h3>
              <p>Thank you for signing up with GymSync. To complete your registration, please verify your email address using the OTP code below:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This code will expire in 10 minutes</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this verification, please ignore this email</li>
              </ul>
              
              <div class="footer">
                <p>Best regards,<br>The GymSync Team</p>
                <p><small>This is an automated email. Please do not reply to this email.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after successful verification
export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"GymSync" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to GymSync! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .welcome-box { background: white; border-left: 4px solid #4f46e5; padding: 20px; margin: 20px 0; }
            .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ Welcome to GymSync!</h1>
              <p>Your fitness journey starts here</p>
            </div>
            <div class="content">
              <div class="welcome-box">
                <h3>Hello ${name}! 👋</h3>
                <p>Congratulations! Your email has been successfully verified and your GymSync account is now active.</p>
              </div>
              
              <h4>What's next?</h4>
              <ul>
                <li>🏃‍♂️ Complete your fitness profile</li>
                <li>💪 Choose your workout plan</li>
                <li>👨‍💼 Connect with our expert trainers</li>
                <li>📊 Track your progress</li>
              </ul>
              
              <p>We're excited to help you achieve your fitness goals!</p>
              
              <p>Best regards,<br>The GymSync Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
};
