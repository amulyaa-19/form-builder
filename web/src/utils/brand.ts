// web/src/utils/brand.ts

/**
 * Converts a hex code to an RGB object.
 * Safely handles 3-digit and 6-digit hex codes.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  const cleanHex = hex.replace(shorthandRegex, (_m, r, g, b) => {
    // Add default empty strings to satisfy strict mode here too
    return (r || '') + (r || '') + (g || '') + (g || '') + (b || '') + (b || '')
  })

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex)

  return result
    ? {
        // We explicitly tell TS these are strings so parseInt is happy
        r: Number.parseInt(result[1] as string, 16),
        g: Number.parseInt(result[2] as string, 16),
        b: Number.parseInt(result[3] as string, 16),
      }
    : null
}

/**
 * Creates a subtle RGBA tint based on the primary brand color.
 * Default opacity is 3%.
 */
export function getBrandTint(hex: string, opacity = 0.03): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(247, 244, 239, 1)` // Fallback to standard #F7F4EF
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
}

/**
 * YIQ Contrast Formula: Determines if white or black text
 * should be used over the given brand color to ensure readability.
 */
export function getContrastTextColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#FDFBF8'

  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  return yiq >= 128 ? '#1C1917' : '#FDFBF8' // Dark text for light bg, light text for dark bg
}

/**
 * Safely updates the document head for white-label branding.
 */
export function setDocumentBrand(title: string, logoUrl?: string | null) {
  document.title = title

  if (logoUrl) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = logoUrl
  }
}
