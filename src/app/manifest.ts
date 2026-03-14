import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Priority - Smart Purchase Planner',
    short_name: 'Priority',
    description: 'Prioritize and plan your purchases intelligently',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F5F0E8',
    theme_color: '#2C1B2E',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/assets/logos/basic_logo_primary.png',
        sizes: '200x201',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/logos/general_logo_primary.png',
        sizes: '270x279',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/logos/basic_logo_foregound.png',
        sizes: '200x201',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}