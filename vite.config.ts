import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    typecheck: {
      tsconfig: "tests/tsconfig.json",
    },
  },
})
