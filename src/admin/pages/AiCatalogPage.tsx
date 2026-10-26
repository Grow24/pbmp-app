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

type McpServer = {
  id: number
  name: string
  transport: 'stdio' | 'http'
  command: string
  args: string[]
  url: string
  hasToken: boolean
  tokenHint: string
  isActive: boolean
  builtin: boolean
}

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
  const [servers, setServers] = useState<McpServer[]>([])
  const [mcp, setMcp] = useState({ name: '', transport: 'stdio', command: '', argsText: '', url: '', token: '' })
  const [mcpTools, setMcpTools] = useState('')

  const load = async () => {
    const catalog = await readJson<{ agents: AgentRow[]; skills: SkillRow[]; team: TeamRow[] }>(
      await fetch('/api/ai/catalog?all=1'),
    )
    setAgents(catalog.agents)
    setSkills(catalog.skills)
    setTeam(catalog.team)
    setRuntime(await readJson<Runtime>(await fetch('/api/ai/runtime')))
    const mcpList = await readJson<{ servers: McpServer[] }>(await fetch('/api/ai/mcp'))
    setServers(mcpList.servers)
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
        <h2 className="text-sm font-semibold text-slate-800">MCP servers</h2>
        <p className="text-[12px] leading-relaxed text-slate-500">
          Chat calls tools from the servers that are on. A model key is required for a live call. PBMP canvas is the built-in server:
          projects, actuals, risks, benefits, sales, canvases, resources, and prompts. A write is saved only after you confirm it in chat.
        </p>
        {servers.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 border-t border-slate-100 pt-2">
            <div>
              <p className="text-[13px] font-medium text-slate-800">
                {item.name} · {item.transport} · {item.isActive ? 'on' : 'off'}
              </p>
              <p className="text-[12px] text-slate-500">
                {item.transport === 'http' ? item.url : `${item.command} ${item.args.join(' ')}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="text-[11px] text-brand-700"
                onClick={() =>
                  void fetch(`/api/ai/mcp/${item.id}/test`, { method: 'POST' })
                    .then(async (response) => {
                      const body = await response.json()
                      if (!response.ok) throw new Error(body.error || 'Test failed')
                      const names = (body.tools || []).map((tool: { name: string }) => tool.name).join(', ')
                      const resources = (body.resources || []).map((entry: { uri: string }) => entry.uri).join(', ')
                      const prompts = (body.prompts || []).map((entry: { name: string }) => entry.name).join(', ')
                      setMcpTools([
                        `${item.name}`,
                        `Tools: ${names || 'none'}`,
                        `Resources: ${resources || 'none'}`,
                        `Prompts: ${prompts || 'none'}`,
                      ].join('\n'))
                      onMessage(`Connected. ${body.tools?.length || 0} tools, ${body.resources?.length || 0} resources, ${body.prompts?.length || 0} prompts.`)
                    })
                    .catch((error) => onMessage(error.message))
                }
              >
                Test
              </button>
              <button
                type="button"
                className="text-[11px] text-slate-600"
                onClick={() =>
                  void fetch(`/api/ai/mcp/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: !item.isActive }),
                  }).then(() => load())
                }
              >
                {item.isActive ? 'Turn off' : 'Turn on'}
              </button>
              <button
                type="button"
                className="text-[11px] text-rose-600"
                onClick={() => void fetch(`/api/ai/mcp/${item.id}`, { method: 'DELETE' }).then(() => load())}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {mcpTools ? <p className="whitespace-pre-wrap text-[12px] text-slate-600">{mcpTools}</p> : null}
        <Field label="Name">
          <TextInput value={mcp.name} placeholder="GitHub" onChange={(event) => setMcp((prev) => ({ ...prev, name: event.target.value }))} />
        </Field>
        <Field label="Transport">
          <Select value={mcp.transport} onChange={(event) => setMcp((prev) => ({ ...prev, transport: event.target.value }))}>
            <option value="stdio">Local command (stdio)</option>
            <option value="http">Remote URL (HTTP)</option>
          </Select>
        </Field>
        {mcp.transport === 'stdio' ? (
          <>
            <Field label="Command">
              <TextInput value={mcp.command} placeholder="npx" onChange={(event) => setMcp((prev) => ({ ...prev, command: event.target.value }))} />
            </Field>
            <Field label="Arguments" hint="One argument on each line.">
              <TextArea rows={3} value={mcp.argsText} placeholder={'-y\n@modelcontextprotocol/server-filesystem\n/home/rudra'} onChange={(event) => setMcp((prev) => ({ ...prev, argsText: event.target.value }))} />
            </Field>
          </>
        ) : (
          <>
            <Field label="URL">
              <TextInput value={mcp.url} placeholder="https://example.com/mcp" onChange={(event) => setMcp((prev) => ({ ...prev, url: event.target.value }))} />
            </Field>
            <Field label="Bearer token" hint="Optional. Leave blank if the server does not need one.">
              <TextInput type="password" value={mcp.token} autoComplete="off" onChange={(event) => setMcp((prev) => ({ ...prev, token: event.target.value }))} />
            </Field>
          </>
        )}
        <button
          type="button"
          className="ui-btn-primary"
          onClick={() =>
            void fetch('/api/ai/mcp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mcp),
            })
              .then(async (response) => {
                if (!response.ok) throw new Error((await response.json()).error || 'Could not add server')
              })
              .then(() => load())
              .then(() => {
                setMcp({ name: '', transport: 'stdio', command: '', argsText: '', url: '', token: '' })
                onMessage('MCP server added.')
              })
              .catch((error) => onMessage(error.message))
          }
        >
          Add MCP server
        </button>
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
