import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

const SIGNATURE = 'The Merchandising Team at Central Grain'

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[twilio] Missing credentials — SMS not sent')
    return
  }
  const normalized = normalizePhone(to)
  if (!normalized) {
    console.warn(`[twilio] Could not normalize phone number: ${to}`)
    return
  }
  const client = twilio(accountSid, authToken)
  await client.messages.create({
    from: fromNumber,
    to: normalized,
    body: `${SIGNATURE}\n\n${body}`,
  })
}
