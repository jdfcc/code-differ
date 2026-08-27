import { reactive, computed } from 'vue'
import { computeLineDiff, classifyChanges } from '../core/diff-engine.js'
import { alignLines, unifiedLines, foldUnchanged } from '../core/line-aligner.js'
import { transformText } from '../core/text-transform.js'

export const SAMPLE_OLD = `function greet(name) {
  return 'Hello, ' + name
}`

export const SAMPLE_NEW = `function greet(name = 'World') {
  return \`Hello, \${name}!\`
}`

export const store = reactive({
  // 输入
  oldText: '',
  newText: '',
  title: '',

  // 设置
  viewMode: 'split', // 'split' | 'unified'
  precision: 'word',  // 'word' | 'char'
  foldUnchangedLines: false,
  wrapLines: false,
  syntaxLang: 'javascript',
  showEditor: false,
  editTarget: null,

  // 忽略选项
  ignore: {
    whitespace: false,
    case: false,
    blankLines: false,
  },

  // 文本转换
  transform: {
    trimTrailing: false,
    normalizeWhitespace: false,
  },
})

// 计算属性
export const diffResult = computed(() => {
  let oldText = store.oldText
  let newText = store.newText

  // 应用文本转换
  const opts = {
    trimTrailingWhitespace: store.transform.trimTrailing,
    normalizeWhitespace: store.transform.normalizeWhitespace || store.ignore.whitespace,
    toLowerCase: store.ignore.case,
    removeBlankLines: store.ignore.blankLines,
  }

  const oldTransformed = transformText(oldText, opts)
  const newTransformed = transformText(newText, opts)

  const oldHasFinalNewline = /\r?\n$/.test(oldTransformed)
  const newHasFinalNewline = /\r?\n$/.test(newTransformed)
  const oldComparable = oldHasFinalNewline ? oldTransformed.replace(/\r?\n$/, '') : oldTransformed
  const newComparable = newHasFinalNewline ? newTransformed.replace(/\r?\n$/, '') : newTransformed

  const changes = computeLineDiff(oldComparable, newComparable, {
    ignoreWhitespace: store.ignore.whitespace,
  })

  const classified = classifyChanges(changes)
  if (oldHasFinalNewline !== newHasFinalNewline) {
    classified.push({ type: 'eof', oldHasFinalNewline, newHasFinalNewline })
  }
  return classified
})

export const splitRows = computed(() => {
  const rows = alignLines(diffResult.value)
  if (store.foldUnchangedLines) {
    return foldUnchanged(rows)
  }
  return rows
})

export const unifiedRows = computed(() => {
  const rows = unifiedLines(diffResult.value)
  if (store.foldUnchangedLines) {
    return foldUnchanged(rows)
  }
  return rows
})

export const stats = computed(() => {
  let added = 0
  let removed = 0
  let oldLines = 0
  let newLines = 0

  for (const chunk of diffResult.value) {
    switch (chunk.type) {
      case 'unchanged':
        oldLines += chunk.lines.length
        newLines += chunk.lines.length
        break
      case 'removed':
        removed += chunk.lines.length
        oldLines += chunk.lines.length
        break
      case 'added':
        added += chunk.lines.length
        newLines += chunk.lines.length
        break
      case 'modified':
        removed += chunk.oldLines.length
        added += chunk.newLines.length
        oldLines += chunk.oldLines.length
        newLines += chunk.newLines.length
        break
    }
  }

  return { added, removed, oldLines, newLines }
})
