import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const src = path.join(root, 'public', 'favicon.svg')
const publicDir = path.join(root, 'public')
mkdirSync(publicDir, { recursive: true })

const svg = readFileSync(src)
const targets = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32x32.png' },
]

for (const { size, name } of targets) {
  const out = path.join(publicDir, name)
  await sharp(svg).resize(size, size).png().toFile(out)
  console.log(`generated ${name}`)
}

// maskable icon with padding
const maskableBuffer = await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 10, g: 10, b: 10, alpha: 1 },
  },
})
  .composite([
    {
      input: await sharp(svg).resize(360, 360).png().toBuffer(),
      gravity: 'center',
    },
  ])
  .png()
  .toBuffer()
writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), maskableBuffer)
console.log('generated pwa-maskable-512x512.png')
