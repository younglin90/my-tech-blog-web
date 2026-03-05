import { withContentlayer } from 'next-contentlayer2'
import type { NextConfig } from 'next'

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export', // Enabling SSG
  images: {
    unoptimized: true,
  },
}

export default withContentlayer(nextConfig)
