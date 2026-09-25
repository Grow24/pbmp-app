import type { ReactNode } from 'react'
import {
  composerTrigger,
  filterByQuery,
  flattenMenu,
  PBMP_SKILLS,
  replaceComposerTrigger,
  SLASH_COMMANDS,
} from '../../ai/composer'
import type { AiAgent, AiTeammate } from '../../ai/types'
import type { MenuSection } from '../../types'

type Props = {
  draft: string
  onChange: (next: string) => void
  agents: AiAgent[]
  team: AiTeammate[]
  menuSections: MenuSection[]
  onAgent?: (slug: string) => void
  onCanvas?: (id: string) => void
}

export function ComposerHintBar({
  draft,
  onInsert,
}: {
  draft: string
  onInsert: (mark: '@' | '$' | '#' | '/') => void
}) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
      <Hint mark="@" label="Who" hint="Agent" onClick={() => onInsert('@')} />
      <Hint mark="$" label="How" hint="Skill" onClick={() => onInsert('$')} />
      <Hint mark="#" label="What" hint="Canvas" onClick={() => onInsert('#')} />
      <Hint mark="/" label="Do" hint="Command" onClick={() => onInsert('/')} />
      {!draft.trim() ? <span className="pl-1 text-slate-400">Type a trigger or ask in plain language</span> : null}
    </div>
  )
}

function Hint({
  mark,
  label,
  hint,
  onClick,
}: {
  mark: string
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 hover:border-brand-300 hover:text-brand-700"
    >
      <span className="font-semibold text-brand-600">{mark}</span>
      <span className="font-medium text-slate-600">{label}</span>
      <span className="text-slate-400">{hint}</span>
    </button>
  )
}

export function ComposerPicker({ draft, onChange, agents, team, menuSections, onAgent, onCanvas }: Props) {
  const trigger = composerTrigger(draft)
  if (!trigger) return null
  const canvases = flattenMenu(menuSections)

  if (trigger.kind === 'at') {
    const agentHits = filterByQuery(agents, trigger.query, (item) => `${item.name} ${item.role}`)
    const teamHits = filterByQuery(team, trigger.query, (item) => `${item.name} ${item.role}`)
    return (
      <PickerShell title="@ Who — Agent or teammate. Agent sets the lens for this turn; teammate posts a Highlight.">
        {agentHits.map((agent) => (
          <PickerRow
            key={agent.slug}
            lead={`@${agent.name}`}
            meta={agent.role}
            onClick={() => {
              onAgent?.(agent.slug)
              onChange(replaceComposerTrigger(draft, 'at', agent.name))
            }}
          />
        ))}
        {teamHits.length ? <p className="border-t border-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400">Teammates</p> : null}
        {teamHits.map((person) => (
          <PickerRow
            key={person.id}
            lead={`@${person.name}`}
            meta={`${person.role} · Highlight`}
            onClick={() => onChange(replaceComposerTrigger(draft, 'at', person.name))}
          />
        ))}
        {!agentHits.length && !teamHits.length ? <Empty /> : null}
      </PickerShell>
    )
  }

  if (trigger.kind === 'dollar') {
    const hits = filterByQuery(PBMP_SKILLS, trigger.query, (item) => `${item.slug} ${item.label} ${item.hint}`)
    return (
      <PickerShell title="$ How — Skill for this turn, shown as a chip like LibreChat.">
        {hits.map((skill) => (
          <PickerRow
            key={skill.slug}
            lead={`$${skill.slug}`}
            meta={skill.hint}
            onClick={() => onChange(replaceComposerTrigger(draft, 'dollar', skill.slug))}
          />
        ))}
        {!hits.length ? <Empty /> : null}
      </PickerShell>
    )
  }

  if (trigger.kind === 'hash') {
    const hits = filterByQuery(canvases, trigger.query, (item) => `${item.id} ${item.label}`)
    return (
      <PickerShell title="# What — open a PBMP canvas as context for this turn.">
        {hits.slice(0, 12).map((item) => (
          <PickerRow
            key={item.id}
            lead={`#${item.id}`}
            meta={item.label}
            onClick={() => {
              onCanvas?.(item.id)
              onChange(replaceComposerTrigger(draft, 'hash', item.id))
            }}
          />
        ))}
        {!hits.length ? <Empty /> : null}
      </PickerShell>
    )
  }

  const hits = filterByQuery(SLASH_COMMANDS, trigger.query, (item) => `${item.token} ${item.label} ${item.hint}`)
  return (
    <PickerShell title="/ Action — built-in command. PBMP maps these to Skills, Agents, or the UI.">
      {hits.map((item) => (
        <PickerRow
          key={item.token}
          lead={`/${item.token}`}
          meta={item.hint}
          onClick={() => onChange(replaceComposerTrigger(draft, 'slash', item.token))}
        />
      ))}
      {!hits.length ? <Empty /> : null}
    </PickerShell>
  )
}

function PickerShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-1 overflow-hidden rounded border border-slate-200 bg-white text-[12px] shadow-sm">
      <p className="border-b border-slate-100 px-2 py-1.5 text-[11px] text-slate-500">{title}</p>
      {children}
    </div>
  )
}

function PickerRow({ lead, meta, onClick }: { lead: string; meta: string; onClick: () => void }) {
  return (
    <button type="button" className="flex w-full items-center justify-between px-2 py-1.5 text-left hover:bg-slate-50" onClick={onClick}>
      <span className="font-medium text-slate-800">{lead}</span>
      <span className="max-w-[58%] truncate text-slate-400">{meta}</span>
    </button>
  )
}

function Empty() {
  return <p className="px-2 py-1.5 text-slate-400">No matches.</p>
}
