import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

import { cn } from '@/lib/cn'

type FieldShellProps = {
  label: ReactNode
  required?: boolean
  hint?: ReactNode
  error?: ReactNode
  className?: string
}

function useFieldIds(error?: ReactNode, hint?: ReactNode) {
  const id = useId()
  const messageId = error || hint ? `${id}-msg` : undefined
  return { id, messageId }
}

function FieldMessage({ id, error, hint }: { id?: string; error?: ReactNode; hint?: ReactNode }) {
  if (error) {
    return (
      <span id={id} className="gt-field__error">
        {error}
      </span>
    )
  }
  if (hint) {
    return (
      <span id={id} className="gt-field__hint">
        {hint}
      </span>
    )
  }
  return null
}

function LabelText({ label, required }: { label: ReactNode; required?: boolean }) {
  return (
    <span>
      {label}
      {required && '*'}
    </span>
  )
}

type TextFieldProps = FieldShellProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
    /** Static prefix shown inside the field, e.g. `+91` for WhatsApp numbers. */
    prefix?: string
  }

/** Labelled input. Errors set `aria-invalid` and are written out, never colour-only. */
export function TextField({
  label,
  required,
  hint,
  error,
  className,
  prefix,
  ...input
}: TextFieldProps) {
  const { messageId } = useFieldIds(error, hint)
  const control = (
    <input
      className="gt-input"
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={messageId}
      {...input}
    />
  )
  return (
    <label className={cn('gt-field', className)}>
      <LabelText label={label} required={required} />
      {prefix ? (
        <span className="gt-input-prefix">
          <span aria-hidden="true">{prefix}</span>
          {control}
        </span>
      ) : (
        control
      )}
      <FieldMessage id={messageId} error={error} hint={hint} />
    </label>
  )
}

type SelectFieldProps = FieldShellProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
    options: (string | { label: string; value: string })[]
  }

export function SelectField({
  label,
  required,
  hint,
  error,
  className,
  options,
  ...select
}: SelectFieldProps) {
  const { messageId } = useFieldIds(error, hint)
  return (
    <label className={cn('gt-field', className)}>
      <LabelText label={label} required={required} />
      <select
        className="gt-input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        {...select}
      >
        {options.map((o) => {
          const opt = typeof o === 'string' ? { label: o, value: o } : o
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        })}
      </select>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </label>
  )
}

type TextAreaFieldProps = FieldShellProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export function TextAreaField({
  label,
  required,
  hint,
  error,
  className,
  ...textarea
}: TextAreaFieldProps) {
  const { messageId } = useFieldIds(error, hint)
  return (
    <label className={cn('gt-field', className)}>
      <LabelText label={label} required={required} />
      <textarea
        className="gt-input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        {...textarea}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </label>
  )
}
