import PurgeCSS, { UserDefinedSafelist } from "purgecss"

/**
 * https://github.com/Jax-p/vite-plugin-html-purgecss
 * MIT License

Copyright (c) 2021 Jax-p

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

export default (safeList?: UserDefinedSafelist) => {
  let _html: string = ""
  return {
    name: "vite-plugin-html-purgecss",
    enforce: "post",
    transformIndexHtml(html) {
      _html += html
    },
    async generateBundle(_options, bundle) {
      const cssFiles = Object.keys(bundle).filter((key) => key.endsWith(".css"))
      if (!cssFiles) return
      for (const file of cssFiles) {
        const purged = await new PurgeCSS().purge({
          content: [{ raw: _html, extension: "html" }, "./src/*"],
          css: [{ raw: bundle[file].source }],
          safelist: safeList || [],
        })
        bundle[file].source = purged[0].css
      }
    },
  }
}
