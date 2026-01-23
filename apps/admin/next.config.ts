import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@ephraimcare/ui',
    '@ephraimcare/utils',
    '@ephraimcare/supabase',
    '@ephraimcare/types',
  ],
}

export default nextConfig
