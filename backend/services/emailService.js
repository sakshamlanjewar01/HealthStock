/**
 * Send email alerts using nodemailer, or log a simulation envelope to the console.
 *
 * NOTE: File-based logging (email-logs.txt) was intentionally removed.
 * Writing PII (names, emails, medication data) to an unencrypted plaintext file
 * on disk is a data privacy risk. All output now goes to structured console logs only.
 *
 * @param {Object} mailOptions
 * @param {string} mailOptions.to            - Recipient email address
 * @param {string} mailOptions.subject       - Email subject line
 * @param {string} mailOptions.text          - Plain-text body
 * @param {string} [mailOptions.html]        - HTML body (falls back to escaped text)
 * @param {Array}  [mailOptions.attachments] - Nodemailer attachments array
 */
export const sendMail = async ({ to, subject, text, html, attachments }) => {
  // Structured console preview — visible in server logs, never written to disk
  console.log(`\n┌────────────────────────────────────────────────────────┐`);
  console.log(`│               [EMAIL DISPATCH SIMULATOR]               │`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  console.log(`│ TO:      ${to.padEnd(46)}│`);
  console.log(`│ SUBJECT: ${subject.padEnd(46)}│`);
  console.log(`├────────────────────────────────────────────────────────┤`);
  const lines = text.split('\n');
  for (const line of lines) {
    console.log(`│ ${line.padEnd(54)} │`);
  }
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  // Read SMTP variables from environment
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@healthstock.com';

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const isDev = process.env.NODE_ENV !== 'production';
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: false, // false = STARTTLS on port 587
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s/g, '') // strip spaces from Gmail app passwords
        },
        tls: isDev ? { rejectUnauthorized: false } : {}
      });

      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
        attachments: attachments || []
      });
      console.log(`[Email Service] ✅ Real email dispatched to ${to}`);
    } catch (err) {
      console.error('[Email Service] ❌ SMTP dispatch failed:', err.message);
    }
  } else {
    console.log(`[Email Service] ⚠️  SMTP not configured — simulation only. Set SMTP_* vars in backend/.env to enable real dispatch.`);
  }
};
