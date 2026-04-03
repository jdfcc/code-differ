<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Toolbar from './components/Toolbar/Toolbar.vue'
import ControlPanel from './components/ControlPanel/ControlPanel.vue'
import DiffViewer from './components/DiffViewer/DiffViewer.vue'
import InputEditor from './components/Editor/InputEditor.vue'
import { store, SAMPLE_OLD, SAMPLE_NEW } from './store/diff-store.js'
import { loadShareIssue } from './utils/github.js'

const diffViewer = ref(null)
const loading = ref(false)
const loadError = ref('')

// --- Resizable sidebar & editor ---
const sidebarWidth = ref(200)
const editorHeight = ref(200)
const draggingSidebar = ref(false)
const draggingEditor = ref(false)

let dragType = null
let startX = 0
let startY = 0
let startVal = 0

function onSidebarHandleDown(e) {
  e.preventDefault()
  dragType = 'sidebar'
  startX = e.clientX
  startVal = sidebarWidth.value
  draggingSidebar.value = true
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onEditorHandleDown(e) {
  e.preventDefault()
  dragType = 'editor'
  startY = e.clientY
  startVal = editorHeight.value
  draggingEditor.value = true
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e) {
  if (dragType === 'sidebar') {
    const delta = e.clientX - startX
    sidebarWidth.value = Math.max(120, Math.min(500, startVal + delta))
  } else if (dragType === 'editor') {
    const delta = startY - e.clientY
    editorHeight.value = Math.max(80, Math.min(600, startVal + delta))
  }
}

function onDragEnd() {
  dragType = null
  draggingSidebar.value = false
  draggingEditor.value = false
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
})

function goToFirstDiff() {
  diffViewer.value?.goToFirstDiff()
}

function fillSampleData() {
  store.oldText = SAMPLE_OLD
  store.newText = SAMPLE_NEW
}

onMounted(async () => {
  const hash = location.hash
  const match = hash.match(/^#issue=(\d+)$/)
  if (!match) {
    fillSampleData()
    return
  }

  loading.value = true
  try {
    const data = await loadShareIssue(match[1])
    store.oldText = data.old
    store.newText = data.new
    store.title = data.title
  } catch (e) {
    loadError.value = '加载分享内容失败：' + e.message
    fillSampleData()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="app-layout">
    <Toolbar />
    <div v-if="loading" class="share-loading">正在加载分享内容...</div>
    <div v-else-if="loadError" class="share-error">{{ loadError }}</div>
    <div class="app-body">
      <ControlPanel :style="{ width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }" @goToFirstDiff="goToFirstDiff" />
      <div
        class="resize-handle-h"
        :class="{ active: draggingSidebar }"
        @mousedown="onSidebarHandleDown"
      ></div>
      <DiffViewer ref="diffViewer" />
    </div>
    <div
      v-if="store.showEditor"
      class="resize-handle-v"
      :class="{ active: draggingEditor }"
      @mousedown="onEditorHandleDown"
    ></div>
    <InputEditor :style="{ height: editorHeight + 'px' }" />
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
}
.app-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.share-loading {
  padding: 12px 16px;
  background: #e8f4fd;
  color: #1976d2;
  font-size: 14px;
  text-align: center;
}
.share-error {
  padding: 12px 16px;
  background: #fdecea;
  color: #d32f2f;
  font-size: 14px;
  text-align: center;
}

/* Resize handles */
.resize-handle-h {
  width: 5px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  flex-shrink: 0;
}
.resize-handle-h:hover, .resize-handle-h.active { background: #10b981; }
.resize-handle-v {
  height: 5px;
  cursor: row-resize;
  background: transparent;
  transition: background 0.15s;
  flex-shrink: 0;
}
.resize-handle-v:hover, .resize-handle-v.active { background: #10b981; }
</style>
