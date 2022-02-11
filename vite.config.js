import htmlPurge from "./purgecss"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [htmlPurge([])],
  resolve: {
    alias: {
      url: "url",
    },
  },
})
