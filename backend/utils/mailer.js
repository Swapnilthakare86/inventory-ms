const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) console.log('SMTP ERROR:', error);
  else console.log('SMTP SERVER READY');
});

const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Inventory MS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendMail };
