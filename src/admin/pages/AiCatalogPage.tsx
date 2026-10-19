import { useEffect, useState } from 'react'
import { Field, PageHead, TextArea, TextInput, Select } from '../ui'

type AgentRow = {
  id: number
  slug: string
  name: string
  role: string
  useWhen: string
  ask: string
  instruction: string
  isActive: boolean
}

type SkillRow = {
  id: number
  slug: string
  label: string
  hint: string
  prompt: string
  intent: string
  isActive: boolean
}

type TeamRow = {
  id: string
  dbId: number
  name: string
  role: string
  isActive: boolean
}

type Runtime = { base: string; model: string; hasKey: boolean; keyHint: string }

const INTENTS = ['ask', 'report', 'diagram', 'chart', 'risk', 'as-is', 'pricing']

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text())
  return response.json() as Promise<T>
}

export function AiCatalogPage({ onMessage }: { onMessage: (text: string) => void }) {
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [team, setTeam] = useState<TeamRow[]>([])
  const [runtime, setRuntime] = useState<Runtime>({ base: '', model: '', hasKey: false, keyHint: '' })
  const [apiKey, setApiKey] = useState('')
  const [skill, setSkill] = useState({ label: '', hint: '', prompt: '', intent: 'ask' })
  const [agent, setAgent] = useState({ name: '', role: '', useWhen: '', ask: '', instruction: '' })
  const [mate, setMate] = useState({ name: '', role: '' })

  const load = async () => {
    const catalog = await readJson<{ agents: AgentRow[]; skills: SkillRow[]; team: TeamRow[] }>(
      await fetch('/api/ai/catalog?all=1'),
    )
    setAgents(catalog.agents)
    setSkills(catalog.skills)
    setTeam(catalog.team)
    setRuntime(await readJson<Runtime>(await fetch('/api/ai/runtime')))
  }

  useEffect(() => {
    void load().catch((error) => onMessage(error.message))
  }, [onMessage])

  return (
    <div className="max-w-3xl space-y-4">
      <PageHead
        title="AI catalog"
        subtitle="Skills, agents, and teammates are stored in MySQL. The workbench and the chat server both read this list."
      />

      <section className="ui-card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Model key</h2>
        <p className="text-[12px] leading-relaxed text-slate-500">
          Saved here, the key is used for chat, image understanding, and cloud voice. Leave the key blank to keep the current one.
          {runtime.hasKey ? ` A key is saved (${runtime.keyHint}).` : ' No key is saved yet, so chat stays on the canvas assistant.'}
        </p>
        <Field label="API base URL">
          <TextInput
            value={runtime.base}
            placeholder="https://api.openai.com/v1"
            onChange={(event) => setRuntime((prev) => ({ ...prev, base: event.target.value }))}
          />
        </Field>
        <Field label="Model">
          <TextInput
            value={runtime.model}
            placeholder="gpt-4o-mini"
            onChange={(event) => setRuntime((prev) => ({ ...prev, model: event.target.value }))}
          />
        </Field>
        <Field label="API key">
          <TextInput type="password" value={apiKey} placeholder="sk-..." onChange={(event) => setApiKey(event.target.value)} autoComplete="off" />
        </Field>
        <div className="flex gap-2">
          <button
            type="button"
            className="ui-btn-primary"
            onClick={() =>
              void fetch('/api/ai/runtime', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base: runtime.base, model: runtime.model, apiKey }),
              })
                .then(() => load())
                .then(() => {
                  setApiKey('')
                  onMessage('Model settings saved.')
                })
            }
          >
            Save model settings
          </button>
          {runtime.hasKey ? (
            <button
              type="button"
              className="ui-btn"
              onClick={() =>
                void fetch('/api/ai/runtime', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clearKey: true }),
                })
                  .then(() => load())
                  .then(() => onMessage('Model key removed.'))
              }
            >
              Remove key
            </button>
          ) : null}
        </div>
      </section>

      <section className="ui-card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Skills</h2>
        {skills.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 border-t border-slate-100 pt-2">
            <div>
              <p className="text-[13px] font-medium text-slate-800">
                ${item.slug} · {item.label}
              </p>
              <p className="text-[12px] text-slate-500">{item.hint} · {item.intent}</p>
            </div>
            <button type="button" className="text-[11px] text-rose-600" onClick={() => void fetch(`/api/ai/skills/${item.id}`, { method: 'DELETE' }).then(() => load())}>
              Delete
            </button>
          </div>
        ))}
        <Field label="Label">
          <TextInput value={skill.label} onChange={(event) => setSkill((prev) => ({ ...prev, label: event.target.value }))} />
        </Field>
        <Field label="Hint">
          <TextInput value={skill.hint} onChange={(event) => setSkill((prev) => ({ ...prev, hint: event.target.value }))} />
        </Field>
        <Field label="Intent">
          <Select value={skill.intent} onChange={(event) => setSkill((prev) => ({ ...prev, intent: event.target.value }))}>
            {INTENTS.map((intent) => (
              <option key={intent} value={intent}>
                {intent}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prompt">
          <TextArea rows={3} value={skill.prompt} onChange={(event) => setSkill((prev) => ({ ...prev, prompt: event.target.value }))} />
        </Field>
        <button
          type="button"
          className="ui-btn-primary"
          onClick={() =>
            void fetch('/api/ai/skills', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(skill),
            })
              .then(() => load())
              .then(() => {
                setSkill({ label: '', hint: '', prompt: '', intent: 'ask' })
                onMessage('Skill added.')
              })
          }
        >
          Add skill
        </button>
      </section>

      <section className="ui-card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Agents</h2>
        {agents.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 border-t border-slate-100 pt-2">
            <div>
              <p className="text-[13px] font-medium text-slate-800">{item.name}</p>
              <p className="text-[12px] text-slate-500">{item.role}</p>
            </div>
            <button type="button" className="text-[11px] text-rose-600" onClick={() => void fetch(`/api/ai/agents/${item.id}`, { method: 'DELETE' }).then(() => load())}>
              Delete
            </button>
          </div>
        ))}
        <Field label="Name">
          <TextInput value={agent.name} onChange={(event) => setAgent((prev) => ({ ...prev, name: event.target.value }))} />
        </Field>
        <Field label="Role">
          <TextInput value={agent.role} onChange={(event) => setAgent((prev) => ({ ...prev, role: event.target.value }))} />
        </Field>
        <Field label="Use when">
          <TextInput value={agent.useWhen} onChange={(event) => setAgent((prev) => ({ ...prev, useWhen: event.target.value }))} />
        </Field>
        <Field label="Starter question">
          <TextInput value={agent.ask} onChange={(event) => setAgent((prev) => ({ ...prev, ask: event.target.value }))} />
        </Field>
        <Field label="Instruction">
          <TextArea rows={3} value={agent.instruction} onChange={(event) => setAgent((prev) => ({ ...prev, instruction: event.target.value }))} />
        </Field>
        <button
          type="button"
          className="ui-btn-primary"
          onClick={() =>
            void fetch('/api/ai/agents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(agent),
            })
              .then(() => load())
              .then(() => {
                setAgent({ name: '', role: '', useWhen: '', ask: '', instruction: '' })
                onMessage('Agent added.')
              })
          }
        >
          Add agent
        </button>
      </section>

      <section className="ui-card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Teammates</h2>
        <p className="text-[12px] text-slate-500">@Name in chat assigns the message. It shows on the bell until marked done.</p>
        {team.map((item) => (
          <div key={item.dbId} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
            <p className="text-[13px] text-slate-800">
              {item.name} <span className="text-slate-400">· {item.role}</span>
            </p>
            <button type="button" className="text-[11px] text-rose-600" onClick={() => void fetch(`/api/ai/team/${item.dbId}`, { method: 'DELETE' }).then(() => load())}>
              Delete
            </button>
          </div>
        ))}
        <Field label="Name">
          <TextInput value={mate.name} onChange={(event) => setMate((prev) => ({ ...prev, name: event.target.value }))} />
        </Field>
        <Field label="Role">
          <TextInput value={mate.role} onChange={(event) => setMate((prev) => ({ ...prev, role: event.target.value }))} />
        </Field>
        <button
          type="button"
          className="ui-btn-primary"
          onClick={() =>
            void fetch('/api/ai/team', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mate),
            })
              .then(() => load())
              .then(() => {
                setMate({ name: '', role: '' })
                onMessage('Teammate added.')
              })
          }
        >
          Add teammate
        </button>
      </section>
    </div>
  )
}
