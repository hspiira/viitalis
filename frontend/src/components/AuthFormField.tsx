interface AuthFormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
  disabled?: boolean
}

export function AuthFormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  placeholder,
  autoComplete,
  disabled,
}: AuthFormFieldProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[var(--foreground)] mb-2"
      >
        {label}
        {required && <span className="text-[var(--destructive)] ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full px-4 py-2.5 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {error && (
        <p className="mt-1 text-sm text-[var(--destructive)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
