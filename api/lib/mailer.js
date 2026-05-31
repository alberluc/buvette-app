import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendMail({ to, subject, html, attachments = [] }) {
  if (!process.env.SMTP_HOST || !to) return
  const transport = createTransport()
  await transport.sendMail({
    from: `"Buvette" <${process.env.REPORT_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    attachments,
  })
}

export async function sendReport({ to, clubName, monthLabel, html, pdfBuffer }) {
  const attachments = pdfBuffer
    ? [{ filename: `bilan-${monthLabel.toLowerCase().replace(/\s/g, '-')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    : []
  await sendMail({ to, subject: `Bilan mensuel – ${clubName} – ${monthLabel}`, html, attachments })
}
