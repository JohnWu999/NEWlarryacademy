import nodemailer from 'nodemailer'

type VerificationEmail = {
  email: string
  code: string
}

type ShipmentEmail = {
  email: string
  recipientName: string
  orderId: string
  trackingNumber: string
  itemsLabel: string
  testMode?: boolean
}

function smtpReady() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function fromAddress() {
  return process.env.SMTP_FROM ?? `"Larry Academy" <${process.env.SMTP_USER ?? 'no-reply@larryacademy.com'}>`
}

function mailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] || character)
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

  await mailTransporter().sendMail({
    from: fromAddress(),
    to: email,
    subject,
    text,
    html,
  })

  return { delivered: true }
}

export async function sendShipmentEmail({
  email,
  recipientName,
  orderId,
  trackingNumber,
  itemsLabel,
  testMode = false,
}: ShipmentEmail) {
  if (!smtpReady()) {
    return { delivered: false, reason: 'SMTP is not configured' }
  }

  const subject = `${testMode ? '【测试邮件·非真实发货】' : ''}你的小问号已经启程｜Larry Academy 发货通知`
  const text = [
    ...(testMode ? ['【这是一封测试邮件，不代表订单已真实发货。】', ''] : []),
    `亲爱的 ${recipientName}：`,
    '',
    '今天，你的小问号离开了我们的工作台。',
    '它带着 3D 打印留下的独特纹理，也带着我们对每一个好问题的期待，正在向你出发。',
    '',
    `商品：${itemsLabel}`,
    `订单编号：${orderId}`,
    `物流单号：${trackingNumber}`,
    '',
    '你可以使用上面的单号在承运方查询物流进度。愿它抵达你的桌面之后，陪伴你提出更好的问题、找到更精彩的答案。',
    '',
    '感谢你支持一件由学生创造、为学习而生的作品。',
    '',
    'Larry Academy',
    '',
    '让每个问号，成为感叹号。',
  ].join('\n')

  const safeName = escapeHtml(recipientName)
  const safeOrderId = escapeHtml(orderId)
  const safeTrackingNumber = escapeHtml(trackingNumber)
  const safeItemsLabel = escapeHtml(itemsLabel)
  const html = `
    <div style="margin:0;padding:32px 16px;background:#f3f5fb;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;color:#172033;line-height:1.8;">
      <div style="max-width:620px;margin:0 auto;overflow:hidden;border-radius:28px;background:#ffffff;box-shadow:0 18px 55px rgba(43,52,93,.13);">
        <div style="padding:34px 38px;background:linear-gradient(135deg,#111936,#30216c 62%,#146f87);color:#ffffff;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.2em;color:#aeeeff;">LARRY ACADEMY · SHIPPING NOTE</p>
          <h1 style="margin:0;font-size:30px;line-height:1.35;">你的小问号，已经启程。</h1>
        </div>
        <div style="padding:34px 38px;">
          ${testMode ? '<div style="margin:0 0 22px;padding:12px 16px;border:1px solid #f5b942;border-radius:12px;background:#fff8df;color:#7a4b00;font-weight:800;">测试邮件 · 不代表订单已真实发货</div>' : ''}
          <p style="margin:0 0 18px;font-size:17px;">亲爱的 <strong>${safeName}</strong>：</p>
          <p style="margin:0 0 16px;">今天，你的小问号离开了我们的工作台。它带着 3D 打印留下的独特纹理，也带着我们对每一个好问题的期待，正在向你出发。</p>
          <div style="margin:25px 0;padding:20px 22px;border:1px solid #e1e6f2;border-radius:18px;background:#f8f9fd;">
            <p style="margin:0 0 8px;"><span style="color:#73809a;">商品：</span><strong>${safeItemsLabel}</strong></p>
            <p style="margin:0 0 8px;"><span style="color:#73809a;">订单编号：</span>${safeOrderId}</p>
            <p style="margin:0;"><span style="color:#73809a;">物流单号：</span><strong style="color:#4f46b8;letter-spacing:.04em;">${safeTrackingNumber}</strong></p>
          </div>
          <p style="margin:0 0 16px;">你可以使用上面的单号在承运方查询物流进度。愿它抵达你的桌面之后，陪伴你提出更好的问题、找到更精彩的答案。</p>
          <p style="margin:0;">感谢你支持一件由学生创造、为学习而生的作品。</p>
          <p style="margin:30px 0 0;color:#667085;">Larry Academy</p>
        </div>
        <div style="padding:24px 38px;background:#10162f;text-align:center;color:#ffffff;font-size:20px;font-weight:900;letter-spacing:.04em;">
          让每个问号，成为感叹号。
        </div>
      </div>
    </div>
  `

  await mailTransporter().sendMail({
    from: fromAddress(),
    to: email,
    subject,
    text,
    html,
  })

  return { delivered: true }
}
