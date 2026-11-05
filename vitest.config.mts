import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // `npm test` runs tests/unit (no database); `npm run test:int` runs tests/int (needs DATABASE_URL).
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/int/**/*.int.spec.ts'],
  },
})
