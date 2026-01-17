/**
 * Generate PWA icons for VinylView
 * This script creates simple placeholder icons using Canvas API
 */

import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ICONS_DIR = join(__dirname, '../public/icons')

// Ensure icons directory exists
mkdirSync(ICONS_DIR, { recursive: true })

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background gradient (dark theme colors)
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#18181b') // zinc-900
  gradient.addColorStop(1, '#27272a') // zinc-800
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Vinyl record shape
  const centerX = size / 2
  const centerY = size / 2
  const outerRadius = size * 0.35
  const innerRadius = size * 0.1

  // Outer circle (vinyl)
  ctx.fillStyle = '#09090b'
  ctx.beginPath()
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
  ctx.fill()

  // Grooves effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    const radius = outerRadius - i * outerRadius * 0.08
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Center label circle
  const labelRadius = outerRadius * 0.4
  const labelGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    labelRadius
  )
  labelGradient.addColorStop(0, '#fbbf24') // amber-400
  labelGradient.addColorStop(1, '#f59e0b') // amber-500
  ctx.fillStyle = labelGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, labelRadius, 0, Math.PI * 2)
  ctx.fill()

  // Center hole
  ctx.fillStyle = '#09090b'
  ctx.beginPath()
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
  ctx.fill()

  // Add text if size is large enough
  if (size >= 512) {
    ctx.fillStyle = '#09090b'
    ctx.font = `bold ${size * 0.08}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('VinylView', centerX, centerY)
  }

  return canvas
}

// Generate icons
console.log('Generating PWA icons...')

const icon192 = generateIcon(192)
writeFileSync(join(ICONS_DIR, 'icon-192.png'), icon192.toBuffer('image/png'))
console.log('✓ Generated icon-192.png')

const icon512 = generateIcon(512)
writeFileSync(join(ICONS_DIR, 'icon-512.png'), icon512.toBuffer('image/png'))
console.log('✓ Generated icon-512.png')

console.log('Icons generated successfully!')
