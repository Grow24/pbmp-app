type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

function recognitionCtor() {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function browserSpeechSupported() {
  return Boolean(recognitionCtor()) && 'speechSynthesis' in window
}

export function listSpeechVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices()
}

export function pickVoice(lang: string, voiceURI = '') {
  const voices = listSpeechVoices()
  if (!voices.length) return null
  if (voiceURI) {
    const exact = voices.find((voice) => voice.voiceURI === voiceURI || voice.name === voiceURI)
    if (exact) return exact
  }
  const wanted = lang.toLowerCase()
  const prefix = wanted.slice(0, 2)
  return (
    voices.find((voice) => voice.lang.toLowerCase() === wanted) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(wanted)) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) ||
    voices[0] ||
    null
  )
}

export function startBrowserStt(options: {
  lang: string
  onText: (text: string, final: boolean) => void
  onEnd: () => void
}) {
  const Ctor = recognitionCtor()
  if (!Ctor) return null
  const rec = new Ctor()
  rec.lang = options.lang
  rec.continuous = false
  rec.interimResults = true
  rec.onresult = (event) => {
    const last = event.results[event.results.length - 1]
    if (!last) return
    options.onText(last[0].transcript, last.isFinal)
  }
  rec.onerror = () => options.onEnd()
  rec.onend = () => options.onEnd()
  rec.start()
  return rec
}

export function speakableText(text: string) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`>]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)
}

export type SpeechStatus = 'idle' | 'playing' | 'paused'

export type SpeechPlayback = {
  status: SpeechStatus
  key: string
}

let cloudAudio: HTMLAudioElement | null = null
let cloudUrl = ''
let generation = 0
let holdPause = false
let playback: SpeechPlayback = { status: 'idle', key: '' }
const playbackListeners = new Set<(state: SpeechPlayback) => void>()

function emitPlayback(next: SpeechPlayback) {
  playback = next
  playbackListeners.forEach((listener) => listener(playback))
}

export function getSpeechPlayback() {
  return playback
}

export function subscribeSpeech(listener: (state: SpeechPlayback) => void) {
  listener(playback)
  playbackListeners.add(listener)
  return () => playbackListeners.delete(listener)
}

function finishPlayback(token: number) {
  if (token !== generation) return
  emitPlayback({ status: 'idle', key: '' })
}

export function speakText(text: string, lang: string, voiceURI = '', rate = 1, key = '') {
  if (!('speechSynthesis' in window)) return false
  const utter = new SpeechSynthesisUtterance(speakableText(text))
  if (!utter.text) return false
  const voice = pickVoice(lang, voiceURI)
  if (voice) {
    utter.voice = voice
    utter.lang = voice.lang || lang
  } else {
    utter.lang = lang
  }
  utter.rate = Math.min(2, Math.max(0.5, rate || 1))
  const token = generation
  const settle = () => finishPlayback(token)
  utter.onend = settle
  utter.onerror = settle
  emitPlayback({ status: holdPause ? 'paused' : 'playing', key })
  window.speechSynthesis.speak(utter)
  if (holdPause) window.speechSynthesis.pause()
  return true
}

function releaseCloudAudio() {
  if (cloudAudio) {
    cloudAudio.onended = null
    cloudAudio.pause()
    cloudAudio = null
  }
  if (cloudUrl) {
    URL.revokeObjectURL(cloudUrl)
    cloudUrl = ''
  }
}

async function speakCloud(text: string, voice: string, speed: number, key: string) {
  const token = generation
  const clean = speakableText(text)
  if (!clean) return
  const response = await fetch('/api/ai/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: clean, voice: voice || 'alloy', speed }),
  })
  if (token !== generation) return
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail.slice(0, 200) || 'Cloud TTS failed')
  }
  const blob = await response.blob()
  if (token !== generation) return
  releaseCloudAudio()
  cloudUrl = URL.createObjectURL(blob)
  cloudAudio = new Audio(cloudUrl)
  cloudAudio.onended = () => {
    releaseCloudAudio()
    finishPlayback(token)
  }
  if (holdPause) {
    emitPlayback({ status: 'paused', key })
    return
  }
  emitPlayback({ status: 'playing', key })
  await cloudAudio.play()
}

export async function speakWithPrefs(
  text: string,
  prefs: {
    speechLang: string
    speechVoice: string
    ttsProvider?: string
    ttsSpeed?: number
    ttsCloudVoice?: string
  },
  key = '',
) {
  const speed = prefs.ttsSpeed ?? 1
  stopSpeaking()
  if (!speakableText(text)) return
  emitPlayback({ status: 'playing', key })
  if (prefs.ttsProvider === 'openai' || prefs.ttsProvider === 'custom') {
    try {
      await speakCloud(text, prefs.ttsCloudVoice || 'alloy', speed, key)
      return
    } catch {
      // Browser voices still work if the cloud endpoint is not configured.
    }
  }
  if (!speakText(text, prefs.speechLang, prefs.speechVoice, speed, key)) {
    emitPlayback({ status: 'idle', key: '' })
  }
}

export function pauseSpeaking() {
  if (playback.status !== 'playing') return
  holdPause = true
  if (cloudAudio && !cloudAudio.paused) cloudAudio.pause()
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) window.speechSynthesis.pause()
  emitPlayback({ status: 'paused', key: playback.key })
}

export function resumeSpeaking() {
  if (playback.status !== 'paused') return
  holdPause = false
  if (cloudAudio) {
    emitPlayback({ status: 'playing', key: playback.key })
    void cloudAudio.play()
    return
  }
  if ('speechSynthesis' in window) window.speechSynthesis.resume()
  emitPlayback({ status: 'playing', key: playback.key })
}

export function stopSpeaking() {
  generation += 1
  holdPause = false
  releaseCloudAudio()
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  emitPlayback({ status: 'idle', key: '' })
}
