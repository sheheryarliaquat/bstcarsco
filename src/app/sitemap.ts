import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bstcars.co'
  const publicPages = [
    '',
    '/about',
    '/how-it-works',
    '/taxi-services',
    '/airport-transfers',
    '/corporate',
    '/areas-we-cover',
    '/drivers',
    '/operators',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
    '/cookie-policy',
    '/login',
    '/register',
  ]

  return publicPages.map(page => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page === '' ? 1.0 : 0.8,
  }))
}
