<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { store, splitRows, unifiedRows, stats } from '../../store/diff-store.js'
import { computeInlineDiff } from '../../core/diff-engine.js'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import bash from 'highlight.js/lib/languages/bash'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'

const languages = { javascript, python, java, c, cpp, csharp, go, rust, typescript, xml, html: xml, css, sql, json, yaml, bash, php, ruby, swift, kotlin }
for (const [name, definition] of Object.entries(languages)) hljs.registerLanguage(name, definition)

const ROW_HEIGHT = 21
const BUFFER = 20 // 上下额外渲染的行数

// --- Split pane ratio ---
const splitContainer = ref(null)
const leftPaneRatio = ref(0.5)
const draggingSplit = ref(false)

function onSplitHandleDown(e) {
  e.preventDefault()
  draggingSplit.value = true
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onSplitDragMove)
  document.addEventListener('mouseup', onSplitDragEnd)
}

function onSplitDragMove(e) {
  const container = splitContainer.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  leftPaneRatio.value = Math.max(0.15, Math.min(0.85, ratio))
}

function onSplitDragEnd() {
  draggingSplit.value = false
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onSplitDragMove)
  document.removeEventListener('mouseup', onSplitDragEnd)
}

// --- 虚拟滚动状态 ---
const leftPane = ref(null)
const rightPane = ref(null)
const unifiedPane = ref(null)
const scrollTop = ref(0)
const containerHeight = ref(600)

let isSyncing = false

function onSplitScroll(source, target) {
  if (isSyncing) return
  isSyncing = true
  if (target) {
    target.scrollTop = source.scrollTop
    target.scrollLeft = source.scrollLeft
  }
  scrollTop.value = source.scrollTop
  requestAnimationFrame(() => { isSyncing = false })
}

function onLeftScroll() {
  if (leftPane.value) {
    onSplitScroll(leftPane.value, rightPane.value)
  }
}
function onRightScroll() {
  if (rightPane.value) {
    onSplitScroll(rightPane.value, leftPane.value)
  }
}
function onUnifiedScroll() {
  if (unifiedPane.value) {
    scrollTop.value = unifiedPane.value.scrollTop
  }
}

// 当前活动的行数据
const activeRows = computed(() =>
  store.viewMode === 'split' ? splitRows.value : unifiedRows.value
)

// 虚拟滚动计算：可见范围
const visibleRange = computed(() => {
  const total = activeRows.value.length
  if (store.wrapLines) return { start: 0, end: total }
  const start = Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER)
  const visibleCount = Math.ceil(containerHeight.value / ROW_HEIGHT) + BUFFER * 2
  const end = Math.min(total, start + visibleCount)
  return { start, end }
})

const totalHeight = computed(() => store.wrapLines ? null : activeRows.value.length * ROW_HEIGHT)
const offsetY = computed(() => store.wrapLines ? 0 : visibleRange.value.start * ROW_HEIGHT)
const visibleRows = computed(() => {
  const { start, end } = visibleRange.value
  return activeRows.value.slice(start, end)
})

// 数据变化时重置滚动
watch(activeRows, () => {
  scrollTop.value = 0
  if (leftPane.value) leftPane.value.scrollTop = 0
  if (rightPane.value) rightPane.value.scrollTop = 0
  if (unifiedPane.value) unifiedPane.value.scrollTop = 0
})

// 测量容器高度
let resizeObserver = null
onMounted(() => {
  updateContainerHeight()
  resizeObserver = new ResizeObserver(updateContainerHeight)
  const el = leftPane.value || unifiedPane.value
  if (el) resizeObserver.observe(el)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  document.removeEventListener('mousemove', onSplitDragMove)
  document.removeEventListener('mouseup', onSplitDragEnd)
})

// viewMode 切换后重新观察
watch(() => store.viewMode, () => {
  scrollTop.value = 0
  resizeObserver?.disconnect()
  setTimeout(() => {
    updateContainerHeight()
    const el = leftPane.value || unifiedPane.value
    if (el) resizeObserver?.observe(el)
  })
})

function updateContainerHeight() {
  const el = leftPane.value || unifiedPane.value
  if (el) containerHeight.value = el.clientHeight
}

// --- 渲染 ---
// 渲染缓存：避免重复的高亮/diff 计算
const renderCache = new Map()
watch(activeRows, () => renderCache.clear())
watch(() => store.precision, () => renderCache.clear())
watch(() => store.syntaxLang, () => renderCache.clear())

function highlight(code, lang) {
  if (!code) return ''
  try {
    if (lang && lang !== 'auto' && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  } catch {
    return escapeHtml(code)
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderInlineDiff(oldContent, newContent, side) {
  if (!oldContent && !newContent) return ''
  const parts = computeInlineDiff(oldContent || '', newContent || '', store.precision)
  let html = ''
  for (const part of parts) {
    const escaped = escapeHtml(part.value)
    if (side === 'left' && part.removed) {
      html += `<span class="inline-removed">${escaped}</span>`
    } else if (side === 'right' && part.added) {
      html += `<span class="inline-added">${escaped}</span>`
    } else if (!part.added && !part.removed) {
      html += escaped
    }
  }
  return html
}

function renderSplitLine(row, side, idx) {
  const cacheKey = `s_${idx}_${side}`
  if (renderCache.has(cacheKey)) return renderCache.get(cacheKey)

  const cell = row[side]
  if (!cell || cell.type === 'placeholder') return ''

  let html
  if (cell.type === 'modified') {
    const otherSide = side === 'left' ? 'right' : 'left'
    const other = row[otherSide]
    if (other && other.type === 'modified') {
      html = renderInlineDiff(row.left.content, row.right.content, side)
    } else {
      html = escapeHtml(cell.content)
    }
  } else {
    html = highlight(cell.content, store.syntaxLang)
  }

  renderCache.set(cacheKey, html)
  return html
}

function renderUnifiedLine(row, idx) {
  const cacheKey = `u_${idx}`
  if (renderCache.has(cacheKey)) return renderCache.get(cacheKey)
  const html = row.type === 'eof' ? escapeHtml(row.content) : highlight(row.content, store.syntaxLang)
  renderCache.set(cacheKey, html)
  return html
}

const editingKey = ref('')

function sourceLine(side, lineNo) {
  const text = side === 'old' ? store.oldText : store.newText
  const lines = text.split(/\r?\n/)
  if (!store.ignore.blankLines) return lines[lineNo - 1] ?? ''
  let visible = 0
  for (const line of lines) {
    if (line.trim() === '') continue
    visible++
    if (visible === lineNo) return line
  }
  return ''
}

function replaceSourceLine(side, lineNo, content) {
  const text = side === 'old' ? store.oldText : store.newText
  const newline = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text.split(/\r?\n/)
  let index = lineNo - 1
  if (store.ignore.blankLines) {
    let visible = 0
    index = lines.findIndex(line => {
      if (line.trim() === '') return false
      visible++
      return visible === lineNo
    })
  }
  if (index < 0 || index >= lines.length) return null
  lines[index] = content
  const updated = lines.join(newline)
  if (side === 'old') store.oldText = updated
  else store.newText = updated
  return index + 1
}

async function startInlineEdit(event, key, side, lineNo) {
  if (!lineNo) return
  editingKey.value = key
  store.showEditor = true
  await nextTick()
  const cell = event.currentTarget
  cell.dataset.original = sourceLine(side, lineNo)
  cell.textContent = cell.dataset.original
  cell.focus()
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(cell)
  selection.removeAllRanges()
  selection.addRange(range)
}

function finishInlineEdit(event, key, side, lineNo) {
  if (editingKey.value !== key) return
  const cell = event.currentTarget
  if (cell.dataset.cancelled !== 'true') {
    const sourceLineNo = replaceSourceLine(side, lineNo, cell.textContent)
    if (sourceLineNo) store.editTarget = { side, lineNo: sourceLineNo }
  }
  delete cell.dataset.cancelled
  editingKey.value = ''
}

function onInlineKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    event.currentTarget.blur()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    event.currentTarget.dataset.cancelled = 'true'
    event.currentTarget.textContent = event.currentTarget.dataset.original || ''
    event.currentTarget.blur()
  }
}

function goToFirstDiff() {
  // 找到第一个 diff 行的索引
  const rows = activeRows.value
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (store.viewMode === 'split') {
      const types = [row.left?.type, row.right?.type]
      if (types.some(t => t === 'removed' || t === 'added' || t === 'modified' || t === 'eof')) {
        const target = i * ROW_HEIGHT - containerHeight.value / 2
        const el = leftPane.value || rightPane.value
        if (el) el.scrollTop = Math.max(0, target)
        return
      }
    } else {
      if (row.type === 'removed' || row.type === 'added' || row.type === 'eof') {
        const target = i * ROW_HEIGHT - containerHeight.value / 2
        if (unifiedPane.value) unifiedPane.value.scrollTop = Math.max(0, target)
        return
      }
    }
  }
}

const copyMessage = ref('')
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    copyMessage.value = '已复制'
  } catch {
    copyMessage.value = '复制失败'
  }
  setTimeout(() => { copyMessage.value = '' }, 1600)
}
function copyAllLeft() { copyText(store.oldText) }
function copyAllRight() { copyText(store.newText) }

function expandFold(fold) {
  store.foldUnchangedLines = false
}

defineExpose({ goToFirstDiff })
</script>

<template>
  <div class="diff-viewer">
    <!-- Split View -->
    <template v-if="store.viewMode === 'split'">
      <div class="pane-headers">
        <div class="pane-header pane-header-left" :style="{ flex: leftPaneRatio }">
          <span class="pane-badge removed-badge">删除</span>
          <span class="pane-stat">{{ stats.oldLines }} 行</span>
          <button class="copy-btn" @click="copyAllLeft" title="复制">{{ copyMessage || '全部复制' }}</button>
        </div>
        <div class="pane-header pane-header-right" :style="{ flex: 1 - leftPaneRatio }">
          <span class="pane-badge added-badge">添加</span>
          <span class="pane-stat">{{ stats.newLines }} 行</span>
          <button class="copy-btn" @click="copyAllRight" title="复制">{{ copyMessage || '全部复制' }}</button>
        </div>
      </div>

      <div class="split-container" ref="splitContainer">
        <div
          class="code-pane code-pane-left"
          :class="{ 'wrap-lines': store.wrapLines }"
          :style="{ flex: leftPaneRatio }"
          ref="leftPane"
          @scroll="onLeftScroll"
        >
          <div :style="{ height: totalHeight == null ? 'auto' : totalHeight + 'px', position: 'relative' }">
            <table class="diff-table" :style="{ position: store.wrapLines ? 'static' : 'absolute', top: offsetY + 'px', left: 0, right: 0 }">
              <tbody>
                <template v-for="(row, i) in visibleRows" :key="'l' + (visibleRange.start + i)">
                  <tr v-if="row.type === 'fold'" class="fold-row" @click="expandFold(row)">
                    <td colspan="2" class="fold-cell">
                      ⋯ 展开 {{ row.count }} 行未更改 ⋯
                    </td>
                  </tr>
                  <tr v-else :class="'line-' + (row.left?.type || '')">
                    <td class="line-no">{{ row.left?.lineNo ?? '' }}</td>
                    <td class="line-content" v-html="renderSplitLine(row, 'left', visibleRange.start + i)"
                      :contenteditable="editingKey === 'l' + (visibleRange.start + i)"
                      title="双击编辑此行"
                      @dblclick="startInlineEdit($event, 'l' + (visibleRange.start + i), 'old', row.left?.lineNo)"
                      @blur="finishInlineEdit($event, 'l' + (visibleRange.start + i), 'old', row.left?.lineNo)"
                      @keydown="onInlineKeydown"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="resize-handle-h"
          :class="{ active: draggingSplit }"
          @mousedown="onSplitHandleDown"
        ></div>

        <div
          class="code-pane code-pane-right"
          :class="{ 'wrap-lines': store.wrapLines }"
          :style="{ flex: 1 - leftPaneRatio }"
          ref="rightPane"
          @scroll="onRightScroll"
        >
          <div :style="{ height: totalHeight == null ? 'auto' : totalHeight + 'px', position: 'relative' }">
            <table class="diff-table" :style="{ position: store.wrapLines ? 'static' : 'absolute', top: offsetY + 'px', left: 0, right: 0 }">
              <tbody>
                <template v-for="(row, i) in visibleRows" :key="'r' + (visibleRange.start + i)">
                  <tr v-if="row.type === 'fold'" class="fold-row" @click="expandFold(row)">
                    <td colspan="2" class="fold-cell">
                      ⋯ 展开 {{ row.count }} 行未更改 ⋯
                    </td>
                  </tr>
                  <tr v-else :class="'line-' + (row.right?.type || '')">
                    <td class="line-no">{{ row.right?.lineNo ?? '' }}</td>
                    <td class="line-content" v-html="renderSplitLine(row, 'right', visibleRange.start + i)"
                      :contenteditable="editingKey === 'r' + (visibleRange.start + i)"
                      title="双击编辑此行"
                      @dblclick="startInlineEdit($event, 'r' + (visibleRange.start + i), 'new', row.right?.lineNo)"
                      @blur="finishInlineEdit($event, 'r' + (visibleRange.start + i), 'new', row.right?.lineNo)"
                      @keydown="onInlineKeydown"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Unified View -->
    <template v-else>
      <div
        class="unified-container"
        :class="{ 'wrap-lines': store.wrapLines }"
        ref="unifiedPane"
        @scroll="onUnifiedScroll"
      >
        <div :style="{ height: totalHeight == null ? 'auto' : totalHeight + 'px', position: 'relative' }">
          <table class="diff-table unified-table" :style="{ position: store.wrapLines ? 'static' : 'absolute', top: offsetY + 'px', left: 0, right: 0 }">
            <tbody>
              <template v-for="(row, i) in visibleRows" :key="'u' + (visibleRange.start + i)">
                <tr v-if="row.type === 'fold'" class="fold-row" @click="expandFold(row)">
                  <td colspan="3" class="fold-cell">
                    ⋯ 展开 {{ row.count }} 行未更改 ⋯
                  </td>
                </tr>
                <tr v-else :class="'line-' + row.type">
                  <td class="line-no">{{ row.leftLineNo ?? '' }}</td>
                  <td class="line-no">{{ row.rightLineNo ?? '' }}</td>
                  <td class="line-content" v-html="renderUnifiedLine(row, visibleRange.start + i)"
                    :contenteditable="editingKey === 'u' + (visibleRange.start + i)"
                    title="双击编辑此行"
                    @dblclick="startInlineEdit($event, 'u' + (visibleRange.start + i), row.type === 'removed' ? 'old' : 'new', row.type === 'removed' ? row.leftLineNo : row.rightLineNo)"
                    @blur="finishInlineEdit($event, 'u' + (visibleRange.start + i), row.type === 'removed' ? 'old' : 'new', row.type === 'removed' ? row.leftLineNo : row.rightLineNo)"
                    @keydown="onInlineKeydown"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.diff-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

/* Pane headers */
.pane-headers {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}
.pane-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  font-size: 12px;
  color: #888;
  background: #fafafa;
}
.pane-header-left { border-right: 1px solid #e8e8e8; }
.pane-badge {
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}
.removed-badge { background: #fdd; color: #c0392b; }
.added-badge { background: #d4edda; color: #27ae60; }
.pane-stat { color: #aaa; }
.copy-btn {
  margin-left: auto;
  border: 1px solid #ddd;
  background: #fff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  color: #666;
}
.copy-btn:hover { background: #f5f5f5; }

/* Split container */
.split-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.code-pane {
  overflow: auto;
}
.code-pane-left { border-right: 1px solid #e8e8e8; }

/* Split pane resize handle */
.resize-handle-h {
  width: 5px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  flex-shrink: 0;
}
.resize-handle-h:hover, .resize-handle-h.active { background: #10b981; }

/* Diff table */
.diff-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 21px;
  table-layout: fixed;
}
.line-no {
  width: 50px;
  min-width: 50px;
  text-align: right;
  padding: 0 8px;
  color: #aaa;
  user-select: none;
  background: inherit;
  border-right: 1px solid #eee;
  vertical-align: top;
  font-size: 12px;
}
.line-content {
  padding: 0 12px;
  white-space: pre;
  overflow: hidden;
  height: 21px;
  line-height: 21px;
}
.line-content[contenteditable="true"] {
  outline: 2px solid #10b981;
  outline-offset: -2px;
  background: #ecfdf5;
  cursor: text;
  overflow: visible;
}
.wrap-lines .line-content {
  white-space: pre-wrap;
  word-break: break-all;
  height: auto;
  overflow: visible;
}

/* Line types */
.line-unchanged { background: #fff; }
.line-removed { background: #fff0f0; }
.line-added { background: #f0fff0; }
.line-placeholder { background: #f8f8f8; }
.line-eof { background: #fff8dc; color: #8a6d3b; font-style: italic; }

/* In split view, left pane modified = red bg, right pane modified = green bg */
.code-pane-left .line-modified { background: #fff0f0; }
.code-pane-right .line-modified { background: #f0fff0; }

tr.line-removed .line-no { background: #ffe0e0; color: #c0392b; }
tr.line-added .line-no { background: #d4edda; color: #27ae60; }
.code-pane-left tr.line-modified .line-no { background: #ffe0e0; color: #c0392b; }
.code-pane-right tr.line-modified .line-no { background: #d4edda; color: #27ae60; }

/* Inline diff highlights */
:deep(.inline-removed) {
  background: #ffb3b3;
  border-radius: 2px;
}
:deep(.inline-added) {
  background: #90ee90;
  border-radius: 2px;
}

/* Fold row */
.fold-row {
  cursor: pointer;
}
.fold-cell {
  text-align: center;
  padding: 6px 0;
  background: #f0f5ff;
  color: #4a90d9;
  font-size: 12px;
  border-top: 1px solid #d6e4f0;
  border-bottom: 1px solid #d6e4f0;
  height: 21px;
  line-height: 9px;
}
.fold-row:hover .fold-cell { background: #e0ecff; }

/* Unified view */
.unified-container {
  flex: 1;
  overflow: auto;
}
.unified-table .line-no { width: 45px; min-width: 45px; }
</style>
