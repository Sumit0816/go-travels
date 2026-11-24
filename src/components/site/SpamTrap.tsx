import type { Ref } from 'react'

import { SPAM_TRAP_FIELD } from '@/lib/spam-trap'

/** Hidden spam trap for public forms (see src/lib/spam-trap.ts). */
export function SpamTrap({ inputRef }: { inputRef?: Ref<HTMLInputElement> }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Leave this empty
        <input
          ref={inputRef}
          type="text"
          name={SPAM_TRAP_FIELD}
          tabIndex={-1}
          autoComplete="off"
          // Tell password managers to skip it too.
          data-lpignore="true"
          data-1p-ignore=""
          data-form-type="other"
        />
      </label>
    </div>
  )
}
