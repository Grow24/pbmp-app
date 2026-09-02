import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-brand-500 ${props.className || ''}`}
    />
  )
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-500 ${props.className || ''}`}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-9 w-full rounded border border-slate-200 bg-white px-2 text-[13px] outline-none focus:border-brand-500 ${props.className || ''}`}
    />
  )
}

export function PageHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>
    </div>
  )
}
