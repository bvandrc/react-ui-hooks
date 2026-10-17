import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/test-support/index.ts'],
  format: 'esm',
  // Unbundled, so a consumer's bundler tree-shakes per module rather than
  // through one file.
  unbundle: true,
  dts: true,
  clean: true,
})
