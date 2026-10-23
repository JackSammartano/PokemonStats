import sharp from 'sharp'
import { mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const source = process.argv[2]
if (!source) throw new Error('Usage: npm run assets:background -- <original-image>')
const directory = fileURLToPath(new URL('../public/images/', import.meta.url))
await mkdir(directory, { recursive: true })
const variants = [
  { name: 'landscape-1600', width: 1600 },
  { name: 'landscape-2400', width: 2400 },
  { name: 'landscape-mobile', width: 900, height: 1600 },
]
for (const { name, ...size } of variants) {
  for (const format of ['avif', 'webp']) {
    const destination = `${directory}/${name}.${format}`
    await sharp(source).rotate().resize({ ...size, fit: 'cover', position: 'centre', withoutEnlargement: true })
      .toFormat(format, { quality: format === 'avif' ? 52 : 80, effort: 6 }).toFile(destination)
    console.log(`${name}.${format}: ${(await stat(destination)).size} bytes`)
  }
}
