// Development-only helper. Sends only the reviewed English UI catalogue to Google Translate.
// Generated JSON is committed; the application never calls a translation service.
import fs from 'node:fs/promises'
const source = JSON.parse(await fs.readFile('src/locales/en.json', 'utf8'))
const languages = ['fr', 'de', 'it', 'pt', 'zh-CN', 'zh-TW', 'ja', 'ko', 'ar', 'hi', 'bn', 'ur', 'ru', 'id', 'tr', 'vi', 'pl', 'nl']
const unchanged = new Set(['Antonio Fuente', 'Beusual', 'Instagram', 'v1.0'])
const placeholders = text => [...text.matchAll(/\{\d+\}/g)].map(m => m[0]).sort().join(',')
async function translate(language) {
  const output = {}
  const keys = Object.keys(source)
  for (let start = 0; start < keys.length; start += 10) {
    const batch = keys.slice(start, start + 10)
    const url = new URL('https://translate.googleapis.com/translate_a/t')
    url.search = new URLSearchParams({ client: 'dict-chrome-ex', sl: 'en', tl: language })
    for (const key of batch) url.searchParams.append('q', source[key])
    let result
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        result = await response.json()
        if (!Array.isArray(result) || result.length !== batch.length) throw new Error('Unexpected translation response')
        break
      } catch (error) {
        if (attempt === 3) throw error
        await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)))
      }
    }
    batch.forEach((key, index) => {
      let value = unchanged.has(key) ? key : result[index]
      if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid translation: ${language} ${key}`)
      // Restore boundary whitespace used next to React expressions.
      value = (key.match(/^\s*/)[0]) + value.trim() + (key.match(/\s*$/)[0])
      value = value.replace(/\{\s*(\d+)\s*\}/g, '{$1}')
      if (placeholders(key) !== placeholders(value)) throw new Error(`Lost placeholders: ${language} ${key}: ${value}`)
      output[key] = value
    })
  }
  await fs.writeFile(`src/locales/${language}.json`, JSON.stringify(output, null, 2) + '\n')
  console.log(`Generated ${language}: ${keys.length} messages`)
}
const queue = process.argv.length > 2 ? languages.filter(language => process.argv.slice(2).includes(language)) : [...languages]
await Promise.all(Array.from({ length: 2 }, async () => {
  while (queue.length) await translate(queue.shift())
}))
