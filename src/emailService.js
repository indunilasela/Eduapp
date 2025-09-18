const nodemailer = require('nodemailer');

// Email configuration
const EMAIL_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '1234567asela@gmail.com',
    pass: process.env.EMAIL_PASS || 'ifks hdzi xeoi pwdd'
  }
};

// Create transporter
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);
    return transporter;
  } catch (error) {
    console.error('❌ Error creating email transporter:', error);
    return null;
  }
};

// Welcome email template
const getWelcomeEmailTemplate = (username, email) => {
  return {
    subject: '🎉 Welcome to EduApp! Your Account is Ready',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EduApp</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .email-container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 10px;
          }
          .welcome-title {
            color: #2E7D32;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .user-info {
            background-color: #E8F5E8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .features {
            margin: 25px 0;
          }
          .feature-item {
            margin: 10px 0;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .feature-item:last-child {
            border-bottom: none;
          }
          .cta-button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .emoji {
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">📚 EduApp</div>
            <h1 class="welcome-title">Welcome to EduApp!</h1>
          </div>
          
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            
            <p>🎉 Congratulations! Your EduApp account has been successfully created. We're thrilled to have you join our learning community!</p>
            
            <div class="user-info">
              <h3>📋 Your Account Details:</h3>
              <p><strong>Username:</strong> ${username}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Account Status:</strong> <span style="color: #4CAF50;">✅ Active</span></p>
            </div>
            
            <div class="features">
              <h3>🚀 What You Can Do Next:</h3>
              <div class="feature-item">
                <span class="emoji">📖</span> <strong>Explore Courses:</strong> Browse our extensive library of educational content
              </div>
              <div class="feature-item">
                <span class="emoji">🎯</span> <strong>Set Learning Goals:</strong> Create personalized learning paths
              </div>
              <div class="feature-item">
                <span class="emoji">👥</span> <strong>Connect with Others:</strong> Join study groups and discussions
              </div>
              <div class="feature-item">
                <span class="emoji">📊</span> <strong>Track Progress:</strong> Monitor your learning journey
              </div>
              <div class="feature-item">
                <span class="emoji">🏆</span> <strong>Earn Achievements:</strong> Complete courses and unlock badges
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">🚀 Start Learning Now</a>
            </div>
            
            <p>If you have any questions or need assistance, our support team is here to help. Simply reply to this email or contact us through the app.</p>
            
            <p>Happy learning! 📚✨</p>
            
            <p>Best regards,<br>
            <strong>The EduApp Team</strong></p>
          </div>
          
          <div class="footer">
            <p>📧 This email was sent to ${email}</p>
            <p>© 2025 EduApp. All rights reserved.</p>
            <p style="font-size: 12px; color: #999;">
              You received this email because you signed up for an EduApp account.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to EduApp!

Hi ${username},

Congratulations! Your EduApp account has been successfully created.

Account Details:
- Username: ${username}
- Email: ${email}
- Status: Active

What you can do next:
- Explore our course library
- Set learning goals
- Connect with other learners
- Track your progress
- Earn achievements

If you have any questions, please don't hesitate to contact our support team.

Happy learning!

Best regards,
The EduApp Team

This email was sent to ${email}
© 2025 EduApp. All rights reserved.
    `
  };
};

// Send welcome email function
const sendWelcomeEmail = async (userEmail, username) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }

    const emailTemplate = getWelcomeEmailTemplate(username, userEmail);
    
    const mailOptions = {
      from: {
        name: 'EduApp Team',
        address: EMAIL_CONFIG.auth.user
      },
      to: userEmail,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html
    };

    console.log(`📧 Sending welcome email to: ${userEmail}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Welcome email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Welcome email sent successfully'
    };
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    
    // Don't fail signup if email fails
    return {
      success: false,
      error: error.message,
      message: 'Account created but email sending failed'
    };
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }
    
    console.log('🔍 Testing email connection...');
    await transporter.verify();
    console.log('✅ Email server connection successful!');
    
    return { success: true, message: 'Email connection verified' };
  } catch (error) {
    console.error('❌ Email connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Password reset email template
const getPasswordResetEmailTemplate = (username, resetToken) => {
  return {
    subject: '🔐 Reset Your EduApp Password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - EduApp</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .email-container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #4A90E2;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            color: #2C3E50;
            margin-bottom: 20px;
          }
          .content {
            font-size: 16px;
            margin-bottom: 25px;
          }
          .reset-button {
            display: inline-block;
            background-color: #E74C3C;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .reset-button:hover {
            background-color: #C0392B;
          }
          .token-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #E74C3C;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .warning {
            background-color: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">📚 EduApp</div>
            <h1 class="title">Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            
            <p>We received a request to reset your password for your EduApp account. Please use the verification code below to reset your password:</p>
            
            <div class="token-info" style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #E74C3C;">
              ${resetToken}
            </div>
            
            <p style="text-align: center; margin: 20px 0;">
              <strong>Enter this 6-digit verification code to reset your password</strong>
            </p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              • This verification code will expire in 1 hour<br>
              • If you didn't request this reset, please ignore this email<br>
              • Never share this verification code with anyone<br>
              • For security, we recommend changing your password regularly
            </div>
            
            <p>Enter this 6-digit code in the password reset form to continue with resetting your password.</p>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EduApp. Please do not reply to this email.</p>
            <p>Need help? Contact our support team.</p>
            <p>&copy; 2025 EduApp. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request - EduApp

Hello ${username},

We received a request to reset your password for your EduApp account.

Your 6-digit verification code: ${resetToken}

This verification code will expire in 1 hour.

Enter this code in the password reset form to continue with resetting your password.

If you didn't request this reset, please ignore this email.

EduApp Team
    `
  };
};

// Function to send password reset email
const sendPasswordResetEmail = async (email, username, resetToken) => {
  try {
    console.log('📧 Sending password reset email...');
    
    const transporter = createTransporter();
    
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }
    
    // No need for reset URL since we're using OTP
    const emailTemplate = getPasswordResetEmailTemplate(username, resetToken);
    
    const mailOptions = {
      from: `"EduApp" <${EMAIL_CONFIG.auth.user}>`,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', result.messageId);
    
    return { 
      success: true, 
      message: 'Password reset email sent successfully',
      messageId: result.messageId 
    };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  testEmailConnection,
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate
};