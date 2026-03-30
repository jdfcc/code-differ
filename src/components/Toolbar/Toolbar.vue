<script setup>
import { store, stats } from '../../store/diff-store.js'

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
  try {
    const data = JSON.stringify({ old: store.oldText, new: store.newText, title: store.title })
    const compressed = btoa(encodeURIComponent(data))
    const url = `${location.origin}${location.pathname}#${compressed}`
    await navigator.clipboard.writeText(url)
    alert('分享链接已复制到剪贴板')
  } catch {
    alert('文本过长，无法生成分享链接')
  }
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <input
        class="title-input"
        v-model="store.title"
        placeholder="输入标题..."
      />
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
      <button class="tb-btn btn-primary" @click="shareDiff">分享</button>
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
.title-input {
  font-size: 16px;
  font-weight: 600;
  border: none;
  outline: none;
  background: transparent;
  width: 200px;
  padding: 4px 0;
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
