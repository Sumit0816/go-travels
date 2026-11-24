/**
 * Hidden "honeypot" field on the public forms. Bots fill every input; people never see this one.
 *
 * The name and label are deliberately meaningless: a field called "website" was being filled by
 * browser autofill, which silently dropped real bookings.
 */
export const SPAM_TRAP_FIELD = 'gt_hp_x7'

export const isSpamTrapFilled = (raw: Record<string, unknown>) => {
  const v = raw[SPAM_TRAP_FIELD]
  return typeof v === 'string' && v.trim() !== ''
}
