export type DraftImage = {
  name: string
  previewUrl: string
  dataUrl: string
  ready: Promise<string>
  revoke: () => void
}

export function beginImageAttach(file: File, resize: boolean): DraftImage {
  const previewUrl = URL.createObjectURL(file)
  let settle: (url: string) => void = () => undefined
  const ready = new Promise<string>((resolve) => {
    settle = resolve
  })
  const draft: DraftImage = {
    name: file.name || 'upload.png',
    previewUrl,
    dataUrl: '',
    ready,
    revoke: () => URL.revokeObjectURL(previewUrl),
  }
  void fileToDataUrl(file, resize).then((dataUrl) => {
    draft.dataUrl = dataUrl
    settle(dataUrl)
  })
  return draft
}

export async function fileToDataUrl(file: File, resize: boolean, maxEdge = 1280): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
  if (!resize || !raw.startsWith('data:image/')) return raw

  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
      const width = Math.round(image.width * scale)
      const height = Math.round(image.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(raw)
        return
      }
      ctx.drawImage(image, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    image.onerror = () => resolve(raw)
    image.src = raw
  })
}