import { useWorkbench } from '../../../context/WorkbenchContext'

export function AccountView() {
  const { settings, blocks, filterItems } = useWorkbench()
  const fields = filterItems(blocks('account').filter((item) => item.blockType === 'account_field'))

  return (
    <div className="mx-auto max-w-xl ui-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
          {settings.user_initials || 'PS'}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{settings.user_name}</h2>
          <p className="text-[13px] text-slate-500">
            {settings.user_role} · {settings.footer_org}
          </p>
        </div>
      </div>
      <dl className="mt-5 space-y-2 text-[13px]">
        {fields.map((field) => (
          <div key={field.id} className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2">
            <dt className="text-slate-400">{field.title}</dt>
            <dd className="text-slate-800">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
