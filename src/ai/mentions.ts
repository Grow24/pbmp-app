import type { AiTeammate } from './types'

export function mentionsInText(text: string, team: AiTeammate[]) {
  const lower = text.toLowerCase()
  return team.filter((person) => lower.includes(`@${person.name.toLowerCase()}`))
}

export function mentionQuery(text: string) {
  const match = text.match(/@([A-Za-z]*)$/)
  return match ? match[1] : null
}

export function filterTeam(team: AiTeammate[], query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return team
  return team.filter(
    (person) =>
      person.name.toLowerCase().includes(needle) || person.role.toLowerCase().includes(needle),
  )
}

export function insertMentionTrigger(text: string) {
  if (text.endsWith('@') || /@[A-Za-z]*$/.test(text)) return text
  return `${text}${text && !/\s$/.test(text) ? ' ' : ''}@`
}
