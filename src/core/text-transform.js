/**
 * 文本预处理
 */
export function transformText(text, options = {}) {
  let result = text

  if (options.trimTrailingWhitespace) {
    result = result.split('\n').map(l => l.trimEnd()).join('\n')
  }

  if (options.normalizeWhitespace) {
    result = result.split('\n').map(l => l.replace(/\s+/g, ' ')).join('\n')
  }

  if (options.toLowerCase) {
    result = result.toLowerCase()
  }

  if (options.removeBlankLines) {
    result = result.split('\n').filter(l => l.trim() !== '').join('\n')
  }

  return result
}
