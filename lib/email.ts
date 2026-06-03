import nodemailer from 'nodemailer'

type VerificationEmail = {
  email: string
  code: string
}

function smtpReady() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function fromAddress() {
  return process.env.SMTP_FROM ?? `"Larry Academy" <${process.env.SMTP_USER ?? 'no-reply@larryacademy.com'}>`
}

export async function sendVerificationEmail({ email, code }: VerificationEmail) {
  const subject = 'Larry Academy email verification code'
  const text = [
    'Welcome to Larry Academy.',
    '',
    'Please enter this verification code on the registration page:',
    '',
    code,
    '',
    'This code will expire in 10 minutes. If you did not request a Larry Academy account, you can safely ignore this email.',
    '',
    'Larry Academy Team',
  ].join('\n')

  const html = `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.6; max-width: 520px;">
      <h1 style="margin: 0 0 8px; color: #2563eb; font-size: 28px;">Welcome to Larry Academy</h1>
      <p>Please enter this verification code on the registration page:</p>
      <p style="font-size: 34px; letter-spacing: 0.2em; font-weight: 900; color: #0f172a; margin: 24px 0; padding: 18px 22px; border-radius: 18px; background: #eff6ff; border: 1px solid #bfdbfe;">${code}</p>
      <p>This code will expire in <strong>10 minutes</strong>. If you did not request a Larry Academy account, you can safely ignore this email.</p>
      <p style="margin-top: 28px; color: #64748b;">Larry Academy Team</p>
    </div>
  `

  if (!smtpReady()) {
    console.info(`[Larry Academy] Verification code for ${email}: ${code}`)
    return { delivered: false, reason: 'SMTP is not configured' }
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: fromAddress(),
    to: email,
    subject,
    text,
    html,
  })

  return { delivered: true }
}
