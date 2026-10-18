/** Downscales large screenshots before upload; keeps text legible while cutting payload size. */
export async function fileToBase64Image(
  file: Blob,
  maxSide = 2000,
): Promise<{ data: string; mimeType: string; previewUrl: string }> {
  const previewUrl = URL.createObjectURL(file)
  const img = new Image()
  img.src = previewUrl
  await img.decode()
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
  return { data: dataUrl.split(',')[1], mimeType: 'image/jpeg', previewUrl }
}
