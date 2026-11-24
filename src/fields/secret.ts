import type { GlobalAfterReadHook, TextField } from 'payload'

/** Pass as `context` to a findGlobal call that needs the stored (encrypted) secret. */
export const INCLUDE_SECRETS = { includeSecrets: true } as const

/**
 * A write-only secret (API key, bot token). The input always shows in the admin, empty: the
 * global's `stripSecrets` read hook removes the stored value, so it never reaches the browser or
 * the REST/GraphQL API. Only server code that passes `INCLUDE_SECRETS` as context gets it (still encrypted —
 * the global's beforeChange hook encrypts it on save).
 *
 * Saving with the box empty keeps the stored value. The seed passes `resetWhatsAppKey` to clear
 * it, so demo data never calls a real provider.
 */
export function secretField(name: string, label: string, description: string): TextField {
  return {
    name,
    label,
    type: 'text',
    admin: { description, autoComplete: 'off' },
    hooks: {
      beforeChange: [
        ({ value, previousValue, context }) =>
          context?.resetWhatsAppKey
            ? null
            : typeof value === 'string' && value.trim() !== ''
              ? value
              : previousValue,
      ],
    },
  }
}

/** Global read hook that removes the named secrets unless the caller passed INCLUDE_SECRETS. */
export function stripSecrets(...names: string[]): GlobalAfterReadHook {
  return ({ doc, context }) => {
    if (context?.includeSecrets) return doc
    const copy = { ...doc }
    for (const n of names) delete copy[n]
    return copy
  }
}
