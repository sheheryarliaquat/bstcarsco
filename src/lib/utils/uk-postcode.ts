import { UK_POSTCODE_REGEX, SERVICE_AREAS } from '@/constants'

export function validateUKPostcode(postcode: string): boolean {
  return UK_POSTCODE_REGEX.test(postcode.trim())
}

export function formatPostcode(postcode: string): string {
  const cleaned = postcode.trim().toUpperCase()
  if (!validateUKPostcode(cleaned)) return cleaned

  const outward = cleaned.replace(/\s+/g, '').slice(0, -3)
  const inward = cleaned.replace(/\s+/g, '').slice(-3)
  return `${outward} ${inward}`
}

export function getAreaFromPostcode(postcode: string): string {
  const formatted = formatPostcode(postcode)
  const match = formatted.match(/^([A-Z]{1,2})/)
  return match ? match[1] : ''
}

export function isLondonPostcode(postcode: string): boolean {
  const area = getAreaFromPostcode(postcode)
  const londonAreas = SERVICE_AREAS.find(a => a.name === 'Greater London')
  if (!londonAreas) return false
  return londonAreas.postcodes.includes(area as never)
}
