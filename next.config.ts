import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    // Type-check runs as its own gate (`npm run typecheck`); Vitest transforms
    // TypeScript without type-checking, per docs/system-architecture.md §3.4.
    ignoreBuildErrors: true,
  },
  // `dev`/`build` in package.json pass `--webpack` deliberately. Source imports use
  // explicit `.js` specifiers (NodeNext-style ESM) while the files on disk are
  // `.ts`/`.tsx`. Webpack bridges that via `resolve.extensionAlias` below; Turbopack has
  // no equivalent yet (vercel/next.js#82945, open as of Next 16.3.4) and fails to resolve
  // every such import. Don't drop `--webpack` without re-checking that issue.
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    }
    return config
  },
}

export default nextConfig
