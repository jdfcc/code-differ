import { reactive, computed, watch } from 'vue'
import { computeLineDiff, classifyChanges, computeInlineDiff } from '../core/diff-engine.js'
import { alignLines, unifiedLines, foldUnchanged } from '../core/line-aligner.js'
import { transformText } from '../core/text-transform.js'

export const SAMPLE_OLD = `Hello World`

export const SAMPLE_NEW = `Hello Vue`

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

  const changes = computeLineDiff(oldTransformed, newTransformed, {
    ignoreWhitespace: store.ignore.whitespace,
  })

  return classifyChanges(changes)
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
