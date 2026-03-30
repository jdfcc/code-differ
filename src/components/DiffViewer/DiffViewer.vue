<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { store, splitRows, unifiedRows, stats } from '../../store/diff-store.js'
import { computeInlineDiff } from '../../core/diff-engine.js'
import hljs from 'highlight.js'

const leftPane = ref(null)
const rightPane = ref(null)
let isSyncing = false

function syncScroll(source, target) {
  if (isSyncing) return
  isSyncing = true
  target.scrollTop = source.scrollTop
  target.scrollLeft = source.scrollLeft
  requestAnimationFrame(() => { isSyncing = false })
}

function onLeftScroll() {
  if (leftPane.value && rightPane.value) {
    syncScroll(leftPane.value, rightPane.value)
  }
}
function onRightScroll() {
  if (leftPane.value && rightPane.value) {
    syncScroll(rightPane.value, leftPane.value)
  }
}

// 语法高亮
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

// 行内 diff 渲染
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

// 为 split view 渲染行内容
function renderSplitLine(row, side) {
  const cell = row[side]
  if (!cell || cell.type === 'placeholder') return ''

  // 对 modified 的行做行内 diff
  if (cell.type === 'modified') {
    const otherSide = side === 'left' ? 'right' : 'left'
    const other = row[otherSide]
    if (other && other.type === 'modified') {
      return renderInlineDiff(row.left.content, row.right.content, side)
    }
  }

  // 语法高亮
  if (store.syntaxLang !== 'auto') {
    return highlight(cell.content, store.syntaxLang)
  }
  return escapeHtml(cell.content)
}

// unified view 行内容
function renderUnifiedLine(row) {
  return escapeHtml(row.content)
}

function goToFirstDiff() {
  const el = document.querySelector('.line-removed, .line-added, .line-modified')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function copyAllLeft() {
  navigator.clipboard.writeText(store.oldText)
}
function copyAllRight() {
  navigator.clipboard.writeText(store.newText)
}

function expandFold(fold) {
  store.foldUnchangedLines = false
}

defineExpose({ goToFirstDiff })
</script>

<template>
  <div class="diff-viewer">
    <!-- Split View -->
    <template v-if="store.viewMode === 'split'">
      <!-- Headers -->
      <div class="pane-headers">
        <div class="pane-header pane-header-left">
          <span class="pane-badge removed-badge">删除</span>
          <span class="pane-stat">{{ stats.oldLines }} 行</span>
          <button class="copy-btn" @click="copyAllLeft" title="复制">全部复制</button>
        </div>
        <div class="pane-header pane-header-right">
          <span class="pane-badge added-badge">添加</span>
          <span class="pane-stat">{{ stats.newLines }} 行</span>
          <button class="copy-btn" @click="copyAllRight" title="复制">全部复制</button>
        </div>
      </div>

      <!-- Code panes -->
      <div class="split-container">
        <div
          class="code-pane"
          :class="{ 'wrap-lines': store.wrapLines }"
          ref="leftPane"
          @scroll="onLeftScroll"
        >
          <table class="diff-table">
            <tbody>
              <template v-for="(row, idx) in splitRows" :key="'l' + idx">
                <tr v-if="row.type === 'fold'" class="fold-row" @click="expandFold(row)">
                  <td colspan="2" class="fold-cell">
                    ⋯ 展开 {{ row.count }} 行未更改 ⋯
                  </td>
                </tr>
                <tr v-else :class="'line-' + (row.left?.type || '')">
                  <td class="line-no">{{ row.left?.lineNo ?? '' }}</td>
                  <td class="line-content" v-html="renderSplitLine(row, 'left')"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div
          class="code-pane"
          :class="{ 'wrap-lines': store.wrapLines }"
          ref="rightPane"
          @scroll="onRightScroll"
        >
          <table class="diff-table">
            <tbody>
              <template v-for="(row, idx) in splitRows" :key="'r' + idx">
                <tr v-if="row.type === 'fold'" class="fold-row" @click="expandFold(row)">
                  <td colspan="2" class="fold-cell">
                    ⋯ 展开 {{ row.count }} 行未更改 ⋯
                  </td>
                </tr>
                <tr v-else :class="'line-' + (row.right?.type || '')">
                  <td class="line-no">{{ row.right?.lineNo ?? '' }}</td>
                  <td class="line-content" v-html="renderSplitLine(row, 'right')"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Unified View -->
    <template v-else>
      <div class="unified-container" :class="{ 'wrap-lines': store.wrapLines }">
        <table class="diff-table unified-table">
          <tbody>
            <template v-for="(row, idx) in unifiedRows" :key="'u' + idx">
              <tr v-if="row.type === 'fold'" class="fold-row" @click="expandFold(row)">
                <td colspan="3" class="fold-cell">
                  ⋯ 展开 {{ row.count }} 行未更改 ⋯
                </td>
              </tr>
              <tr v-else :class="'line-' + row.type">
                <td class="line-no">{{ row.leftLineNo ?? '' }}</td>
                <td class="line-no">{{ row.rightLineNo ?? '' }}</td>
                <td class="line-content" v-html="renderUnifiedLine(row)"></td>
              </tr>
            </template>
          </tbody>
        </table>
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
  flex: 1;
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
  flex: 1;
  overflow: auto;
  border-right: 1px solid #e8e8e8;
}
.code-pane:last-child { border-right: none; }

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
}
.wrap-lines .line-content {
  white-space: pre-wrap;
  word-break: break-all;
}

/* Line types */
.line-unchanged { background: #fff; }
.line-removed { background: #fff0f0; }
.line-added { background: #f0fff0; }
.line-placeholder { background: #f8f8f8; }

/* In split view, left pane modified = red bg, right pane modified = green bg */
.code-pane:first-child .line-modified { background: #fff0f0; }
.code-pane:last-child .line-modified { background: #f0fff0; }

tr.line-removed .line-no { background: #ffe0e0; color: #c0392b; }
tr.line-added .line-no { background: #d4edda; color: #27ae60; }
.code-pane:first-child tr.line-modified .line-no { background: #ffe0e0; color: #c0392b; }
.code-pane:last-child tr.line-modified .line-no { background: #d4edda; color: #27ae60; }

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
}
.fold-row:hover .fold-cell { background: #e0ecff; }

/* Unified view */
.unified-container {
  flex: 1;
  overflow: auto;
}
.unified-table .line-no { width: 45px; min-width: 45px; }
</style>
