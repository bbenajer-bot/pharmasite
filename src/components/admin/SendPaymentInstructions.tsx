'use client'

import { toast, useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'

/** Order sidebar button: email the customer the payment instructions for their chosen method. */
export function SendPaymentInstructions() {
  const { id } = useDocumentInfo()
  const { config } = useConfig()
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined)
  const sentAtField = useFormFields(([fields]) => fields.paymentInstructionsSentAt?.value as string | undefined)
  const email = useFormFields(([fields]) => fields.email?.value as string | undefined)
  const [sentAt, setSentAt] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  if (!id) return null
  const lastSent = sentAt ?? sentAtField
  const disabled = busy || status !== 'awaiting-payment'

  async function send() {
    const again = lastSent ? ` again (last sent ${new Date(lastSent).toLocaleString()})` : ''
    if (!window.confirm(`Email payment instructions to ${email ?? 'the customer'}${again}?`)) return
    setBusy(true)
    try {
      const res = await fetch(`${config.serverURL}${config.routes.api}/orders/${id}/send-payment-instructions`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = (await res.json()) as { sentAt?: string; error?: string }
      if (!res.ok) throw new Error(data.error || 'Could not send the email.')
      setSentAt(data.sentAt)
      toast.success('Payment instructions sent.')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <button
        type="button"
        className="btn btn--style-primary btn--size-medium"
        style={{ width: '100%', margin: 0 }}
        onClick={send}
        disabled={disabled}
      >
        {busy ? 'Sending…' : lastSent ? 'Resend payment instructions' : 'Send payment instructions'}
      </button>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85em', opacity: 0.75 }}>
        {status !== 'awaiting-payment'
          ? 'Only for orders awaiting payment.'
          : lastSent
            ? `Last sent ${new Date(lastSent).toLocaleString()}.`
            : 'Emails the instructions for the customer’s chosen payment method (edit them in Shop Settings).'}
      </p>
    </div>
  )
}
