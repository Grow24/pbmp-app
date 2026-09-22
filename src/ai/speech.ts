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

export function speakText(text: string, lang: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text.slice(0, 4000))
  utter.lang = lang
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}