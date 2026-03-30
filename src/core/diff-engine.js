import { diffLines, diffWords, diffChars } from 'diff'

/**
 * 行级 diff
 */
export function computeLineDiff(oldText, newText, options = {}) {
  const diffOpts = {}
  if (options.ignoreWhitespace) diffOpts.ignoreWhitespace = true

  const changes = diffLines(oldText, newText, diffOpts)
  return changes
}

/**
 * 行内差异（单词级或字符级）
 */
export function computeInlineDiff(oldLine, newLine, precision = 'word') {
  const fn = precision === 'char' ? diffChars : diffWords
  return fn(oldLine, newLine)
}

/**
 * 将 diff 结果标记为 modified（连续的 removed + added 视为修改）
 */
export function classifyChanges(changes) {
  const result = []
  let i = 0

  while (i < changes.length) {
    const current = changes[i]

    if (current.removed && i + 1 < changes.length && changes[i + 1].added) {
      // 连续的 removed + added → modified
      const removed = current
      const added = changes[i + 1]
      result.push({
        type: 'modified',
        oldLines: removed.value.replace(/\n$/, '').split('\n'),
        newLines: added.value.replace(/\n$/, '').split('\n'),
      })
      i += 2
    } else if (current.removed) {
      result.push({
        type: 'removed',
        lines: current.value.replace(/\n$/, '').split('\n'),
      })
      i++
    } else if (current.added) {
      result.push({
        type: 'added',
        lines: current.value.replace(/\n$/, '').split('\n'),
      })
      i++
    } else {
      result.push({
        type: 'unchanged',
        lines: current.value.replace(/\n$/, '').split('\n'),
      })
      i++
    }
  }

  return result
}
