<script setup>
import { ref, onMounted } from 'vue'
import Toolbar from './components/Toolbar/Toolbar.vue'
import ControlPanel from './components/ControlPanel/ControlPanel.vue'
import DiffViewer from './components/DiffViewer/DiffViewer.vue'
import InputEditor from './components/Editor/InputEditor.vue'
import { store, SAMPLE_OLD, SAMPLE_NEW } from './store/diff-store.js'
import { loadShareIssue } from './utils/github.js'

const diffViewer = ref(null)
const loading = ref(false)
const loadError = ref('')

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
      <ControlPanel @goToFirstDiff="goToFirstDiff" />
      <DiffViewer ref="diffViewer" />
    </div>
    <InputEditor />
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
</style>
