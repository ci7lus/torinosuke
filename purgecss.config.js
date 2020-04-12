module.exports = {
  mode: "postcss",
  content: ["./src/**/*.html", "./src/**/*.ts", "./src/**/*.tsx"],
  whitelist: ["body", "html", "svg"],
  extractors: [
    {
      extensions: ["html", "ts", "tsx"],
      extractor: class Extractor {
        static extract(content) {
          return content.match(/[A-Za-z0-9-_:/]+/g) || []
        }
      },
    },
  ],
}
