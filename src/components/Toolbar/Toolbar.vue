<script setup>
import { ref } from 'vue'
import { store, stats } from '../../store/diff-store.js'
import { createShareIssue } from '../../utils/github.js'

const sharing = ref(false)

function clearAll() {
  store.oldText = ''
  store.newText = ''
  store.title = ''
}

function exportDiff() {
  const rows = document.querySelector('.diff-viewer')
  if (!rows) return
  const blob = new Blob([rows.innerText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${store.title || 'diff'}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

async function shareDiff() {
  if (sharing.value) return
  if (!store.title.trim()) {
    alert('请先输入标题再分享')
    return
  }
  sharing.value = true
  try {
    const issueNumber = await createShareIssue(store.title, store.oldText, store.newText)
    const url = `${location.origin}${location.pathname}#issue=${issueNumber}`
    await navigator.clipboard.writeText(url)
    alert('分享链接已复制到剪贴板')
  } catch (e) {
    alert('分享失败：' + e.message)
  } finally {
    sharing.value = false
  }
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="title-wrapper">
        <input
          class="title-input"
          v-model="store.title"
          placeholder="输入标题..."
        />
        <svg class="edit-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>
    </div>
    <div class="toolbar-center">
      <span class="stat stat-removed">
        <span class="stat-icon">−</span> {{ stats.removed }} 删除
      </span>
      <span class="stat-separator">|</span>
      <span class="stat stat-added">
        <span class="stat-icon">+</span> {{ stats.added }} 添加
      </span>
    </div>
    <div class="toolbar-right">
      <button class="tb-btn" @click="clearAll">清除</button>
      <button class="tb-btn" @click="exportDiff">导出</button>
      <button class="tb-btn btn-primary" @click="shareDiff" :disabled="sharing">
        {{ sharing ? '分享中...' : '分享' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  gap: 16px;
  flex-shrink: 0;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.title-input {
  font-size: 16px;
  font-weight: 600;
  border: none;
  outline: none;
  background: transparent;
  width: 200px;
  padding: 4px 20px 4px 0;
  border-bottom: 1px dashed transparent;
  transition: border-color 0.2s;
}
.title-input:hover,
.title-input:focus {
  border-bottom-color: #10b981;
}
.edit-icon {
  position: absolute;
  right: 2px;
  color: #bbb;
  pointer-events: none;
  transition: color 0.2s;
}
.title-wrapper:hover .edit-icon,
.title-input:focus ~ .edit-icon {
  color: #10b981;
}
.title-input::placeholder { color: #ccc; }
.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.stat-removed { color: #e74c3c; }
.stat-added { color: #27ae60; }
.stat-icon { font-weight: 700; }
.stat-separator { color: #ddd; }
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tb-btn {
  padding: 6px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.tb-btn:hover { background: #f5f5f5; }
.btn-primary {
  background: #10b981;
  color: #fff;
  border-color: #10b981;
}
.btn-primary:hover { background: #059669; }
</style>
