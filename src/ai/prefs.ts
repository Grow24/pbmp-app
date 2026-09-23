import type { AppSettings } from '../types'
import type { AiLayout, AiPrefs, AiStartupEvent, AiTheme } from './types'

function flag(value: string | undefined, fallback = true) {
  if (value == null || value === '') return fallback
  return value === '1' || value === 'true' || value === 'yes'
}

const THEMES: AiTheme[] = ['light', 'dark', 'slate', 'warm']
const LAYOUTS: AiLayout[] = ['fixed', 'movable']
const EVENTS: AiStartupEvent[] = ['none', 'open-chat', 'quote-canvas', 'speak-title']

function oneOf<T extends string>(value: string | undefined, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export const THEME_OPTIONS: { value: AiTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'slate', label: 'Slate' },
  { value: 'warm', label: 'Warm paper' },
]

export const LAYOUT_OPTIONS: { value: AiLayout; label: string }[] = [
  { value: 'fixed', label: 'Fixed — widgets stay put' },
  { value: 'movable', label: 'Movable — drag KPI widgets' },
]

export const EVENT_OPTIONS: { value: AiStartupEvent; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'open-chat', label: 'Open chat panel' },
  { value: 'quote-canvas', label: 'Quote the open canvas into chat' },
  { value: 'speak-title', label: 'Speak the canvas title' },
]

export function prefsFromSettings(settings: AppSettings): AiPrefs {
  return {
    autoScroll: flag(settings.ai_auto_scroll, true),
    stt: flag(settings.ai_stt, true),
    tts: flag(settings.ai_tts, false),
    ttsAutoplay: flag(settings.ai_tts_autoplay, false),
    speechLang: settings.ai_speech_lang || 'en-IN',
    autoSendMs: Number(settings.ai_auto_send_ms || 900),
    imageResize: flag(settings.ai_image_resize, true),
    longPaste: flag(settings.ai_long_paste, true),
    clock24h: flag(settings.ai_clock_24h, true),
    weekStart: Number(settings.ai_week_start || 1),
    theme: oneOf(settings.ai_theme, THEMES, 'light'),
    layout: oneOf(settings.ai_layout, LAYOUTS, 'movable'),
    startupEvent: oneOf(settings.ai_startup_event, EVENTS, 'none'),
    compactChat: flag(settings.ai_compact_chat, false),
  }
}

export function prefsToSettings(prefs: AiPrefs): Record<string, string> {
  return {
    ai_auto_scroll: prefs.autoScroll ? '1' : '0',
    ai_stt: prefs.stt ? '1' : '0',
    ai_tts: prefs.tts ? '1' : '0',
    ai_tts_autoplay: prefs.ttsAutoplay ? '1' : '0',
    ai_speech_lang: prefs.speechLang,
    ai_auto_send_ms: String(prefs.autoSendMs),
    ai_image_resize: prefs.imageResize ? '1' : '0',
    ai_long_paste: prefs.longPaste ? '1' : '0',
    ai_clock_24h: prefs.clock24h ? '1' : '0',
    ai_week_start: String(prefs.weekStart),
    ai_theme: prefs.theme,
    ai_layout: prefs.layout,
    ai_startup_event: prefs.startupEvent,
    ai_compact_chat: prefs.compactChat ? '1' : '0',
  }
}

export function applyTheme(theme: AiTheme) {
  document.documentElement.dataset.theme = theme
}
