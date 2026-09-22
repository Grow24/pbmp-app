import type { AppSettings } from '../types'
import type { AiPrefs } from './types'

function flag(value: string | undefined, fallback = true) {
  if (value == null || value === '') return fallback
  return value === '1' || value === 'true' || value === 'yes'
}

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
  }
}