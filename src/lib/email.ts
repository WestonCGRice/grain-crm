import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.SMTP_FROM ?? 'noreply@centralgrain.com'
const APP_URL = process.env.APP_URL ?? 'https://farmops-production.up.railway.app'

export async function sendInviteEmail(to: string, name: string, token: string) {
  const link = `${APP_URL}/setup-account?token=${token}`
  await transporter.sendMail({
    from: `"Central Grain" <${FROM}>`,
    to,
    subject: 'Your Central Grain Account Invitation',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d2c3f;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">Central Grain — England, AR</h1>
        </div>
        <div style="padding:32px;background:#f8fafc;border:1px solid #e2e8f0;">
          <h2 style="color:#1d2c3f;margin-top:0;">You've been invited</h2>
          <p>Hello ${name},</p>
          <p>An administrator has created an account for you on the Central Grain merchandising platform.</p>
          <p>Click the button below to set your password and configure two-factor authentication (Microsoft Authenticator or any TOTP app).</p>
          <p style="text-align:center;margin:32px 0;">
            <a href="${link}" style="background:#1d2c3f;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
              Set Up My Account
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">This link expires in 72 hours. If you did not expect this email, please disregard it.</p>
          <p style="color:#6b7280;font-size:13px;">Link: <a href="${link}" style="color:#1d2c3f;">${link}</a></p>
        </div>
      </div>
    `,
  })
}

export async function sendContractNotificationEmail(
  to: string[],
  opts: {
    dealLabel: string
    contractNumber: string | null
    commodity: string
    contactName: string
    quantity: string
    futuresPrice: string
    basis: string | null
    cashPrice: string | null
    totalValue: string
    cropYear: string | null
    futuresMonth: string | null
    futuresYear: string | null
    hedged: string | null
    status: string
    dealDate: string
    notes: string | null
  }
) {
  if (to.length === 0) return

  const unit = opts.commodity === 'RICE' ? 'CWT' : 'Bu'
  const statusLabel: Record<string, string> = {
    PENDING: 'Target', COMPLETED: 'Completed',
    COMPLETED_UNFILLED: 'Completed - Unfilled',
    COMPLETED_FILLED: 'Completed - Filled Not Settled',
    SETTLED: 'Settled', DELETED: 'Deleted',
  }

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px;font-weight:600;color:#374151;width:180px;">${label}</td>
     <td style="padding:6px 12px;color:#111827;">${value}</td></tr>`

  await transporter.sendMail({
    from: `"Central Grain" <${FROM}>`,
    to: to.join(', '),
    subject: `New ${opts.dealLabel} Contract${opts.contractNumber ? ` #${opts.contractNumber}` : ''} — ${opts.commodity} for ${opts.contactName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#1d2c3f;padding:20px 24px;">
          <h1 style="color:white;margin:0;font-size:18px;">New ${opts.dealLabel} Contract</h1>
          <p style="color:#c8d8e8;margin:4px 0 0;font-size:14px;">Central Grain — England, AR</p>
        </div>
        <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <thead>
              <tr style="background:#1d2c3f;">
                <td colspan="2" style="padding:10px 12px;color:white;font-weight:600;">Contract Details</td>
              </tr>
            </thead>
            <tbody>
              ${opts.contractNumber ? row('Contract Number', opts.contractNumber) : ''}
              ${row('Contact', opts.contactName)}
              ${row('Commodity', opts.commodity)}
              ${row('Status', statusLabel[opts.status] ?? opts.status)}
              ${row('Quantity', `${Number(opts.quantity).toLocaleString()} ${unit}`)}
              ${row(`Futures Price / ${unit}`, `$${Number(opts.futuresPrice).toFixed(4)}`)}
              ${opts.basis != null ? row(`Basis / ${unit}`, `$${Number(opts.basis).toFixed(4)}`) : ''}
              ${opts.cashPrice != null ? row(`Cash Price / ${unit}`, `$${Number(opts.cashPrice).toFixed(4)}`) : ''}
              ${row('Total Value', `$${Number(opts.totalValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`)}
              ${opts.cropYear ? row('Crop Year', opts.cropYear) : ''}
              ${opts.futuresMonth ? row('Futures Month', opts.futuresMonth) : ''}
              ${opts.futuresYear ? row('Futures Year', opts.futuresYear) : ''}
              ${opts.hedged ? row('Transaction Hedged', opts.hedged) : ''}
              ${row('Contract Date', opts.dealDate)}
              ${opts.notes ? row('Notes', opts.notes) : ''}
            </tbody>
          </table>
        </div>
      </div>
    `,
  })
}
