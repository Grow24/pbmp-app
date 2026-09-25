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

export function speakText(text: string, lang: string, voiceURI = '', rate = 1) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(speakableText(text))
  if (!utter.text) return
  const voice = pickVoice(lang, voiceURI)
  if (voice) {
    utter.voice = voice
    utter.lang = voice.lang || lang
  } else {
    utter.lang = lang
  }
  utter.rate = Math.min(2, Math.max(0.5, rate || 1))
  window.speechSynthesis.speak(utter)
}

let cloudAudio: HTMLAudioElement | null = null
let cloudUrl = ''

function stopCloudAudio() {
  if (cloudAudio) {
    cloudAudio.pause()
    cloudAudio = null
  }
  if (cloudUrl) {
    URL.revokeObjectURL(cloudUrl)
    cloudUrl = ''
  }
}

async function speakCloud(text: string, voice: string, speed: number) {
  const clean = speakableText(text)
  if (!clean) return
  const response = await fetch('/api/ai/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: clean, voice: voice || 'alloy', speed }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail.slice(0, 200) || 'Cloud TTS failed')
  }
  const blob = await response.blob()
  stopCloudAudio()
  cloudUrl = URL.createObjectURL(blob)
  cloudAudio = new Audio(cloudUrl)
  cloudAudio.onended = () => stopCloudAudio()
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
) {
  const speed = prefs.ttsSpeed ?? 1
  stopSpeaking()
  if (prefs.ttsProvider === 'openai' || prefs.ttsProvider === 'custom') {
    try {
      await speakCloud(text, prefs.ttsCloudVoice || 'alloy', speed)
      return
    } catch {
      // Browser voices still work if the cloud endpoint is not configured.
    }
  }
  speakText(text, prefs.speechLang, prefs.speechVoice, speed)
}

export function stopSpeaking() {
  stopCloudAudio()
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
