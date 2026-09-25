import type { AppSettings } from '../types'
import type { AiLayout, AiPrefs, AiStartupEvent, AiTheme, TtsProvider } from './types'

function flag(value: string | undefined, fallback = true) {
  if (value == null || value === '') return fallback
  return value === '1' || value === 'true' || value === 'yes'
}

const THEMES: AiTheme[] = ['light', 'dark', 'slate', 'warm']
const LAYOUTS: AiLayout[] = ['fixed', 'movable']
const EVENTS: AiStartupEvent[] = ['none', 'open-chat', 'quote-canvas', 'speak-title']
const TTS_PROVIDERS: TtsProvider[] = ['browser', 'openai', 'custom']

export const TTS_PROVIDER_OPTIONS: { value: TtsProvider; label: string }[] = [
  { value: 'browser', label: 'Browser — OS voices, no extra setup' },
  { value: 'openai', label: 'Cloud — OpenAI-compatible TTS' },
  { value: 'custom', label: 'Custom — OpenAI/ElevenLabs-compatible endpoint' },
]

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
  { value: 'movable', label: 'Movable — drag KPI and artifact widgets' },
]

export const SPEECH_LANG_OPTIONS: { value: string; label: string }[] = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'hi-IN', label: 'Hindi (India)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
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
    tts: flag(settings.ai_tts, true),
    ttsProvider: oneOf(settings.ai_tts_provider, TTS_PROVIDERS, 'browser'),
    ttsSpeed: Math.min(2, Math.max(0.5, Number(settings.ai_tts_speed || 1) || 1)),
    ttsCloudVoice: settings.ai_tts_cloud_voice || 'alloy',
    ttsAutoplay: flag(settings.ai_tts_autoplay, false),
    voiceReplyAfterMic: flag(settings.ai_voice_reply_after_mic, true),
    speechLang: settings.ai_speech_lang || 'en-IN',
    speechVoice: settings.ai_speech_voice || '',
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
    ai_tts_provider: prefs.ttsProvider,
    ai_tts_speed: String(prefs.ttsSpeed),
    ai_tts_cloud_voice: prefs.ttsCloudVoice,
    ai_tts_autoplay: prefs.ttsAutoplay ? '1' : '0',
    ai_voice_reply_after_mic: prefs.voiceReplyAfterMic ? '1' : '0',
    ai_speech_lang: prefs.speechLang,
    ai_speech_voice: prefs.speechVoice,
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
