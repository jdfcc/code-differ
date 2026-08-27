<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { store } from '../../store/diff-store.js'

const oldDraft = ref(store.oldText)
const newDraft = ref(store.newText)
const oldTextarea = ref(null)
const newTextarea = ref(null)
let timer

watch(() => store.oldText, value => { if (value !== oldDraft.value) oldDraft.value = value })
watch(() => store.newText, value => { if (value !== newDraft.value) newDraft.value = value })
watch([oldDraft, newDraft], () => {
  clearTimeout(timer)
  timer = setTimeout(flush, 120)
})

watch(() => store.editTarget, async target => {
  if (!target) return
  await nextTick()
  const textarea = target.side === 'old' ? oldTextarea.value : newTextarea.value
  const text = target.side === 'old' ? oldDraft.value : newDraft.value
  if (!textarea) return
  const lines = text.split(/\r?\n/)
  const lineIndex = Math.max(0, Math.min(lines.length - 1, target.lineNo - 1))
  const newline = text.includes('\r\n') ? '\r\n' : '\n'
  const start = lines.slice(0, lineIndex).join(newline).length + (lineIndex ? newline.length : 0)
  textarea.focus()
  textarea.setSelectionRange(start, start + lines[lineIndex].length)
  store.editTarget = null
})

function flush() {
  clearTimeout(timer)
  store.oldText = oldDraft.value
  store.newText = newDraft.value
}

onBeforeUnmount(flush)
</script>

<template>
  <div class="editor-panel" v-if="store.showEditor">
    <div class="editor-header">
      <span>编辑输入</span>
      <button class="close-btn" @click="store.showEditor = false">×</button>
    </div>
    <div class="editor-body">
      <div class="editor-col">
        <div class="editor-col-header">原始文本</div>
        <textarea
          class="editor-textarea"
          ref="oldTextarea"
          v-model="oldDraft"
          placeholder="粘贴原始文本..."
          spellcheck="false"
        ></textarea>
      </div>
      <div class="editor-col">
        <div class="editor-col-header">修改文本</div>
        <textarea
          class="editor-textarea"
          ref="newTextarea"
          v-model="newDraft"
          placeholder="粘贴修改后的文本..."
          spellcheck="false"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-panel {
  border-top: 1px solid #e8e8e8;
  background: #fff;
  flex-shrink: 0;
}
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  border-bottom: 1px solid #f0f0f0;
}
.close-btn {
  border: none;
  background: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
}
.close-btn:hover { color: #333; }
.editor-body {
  display: flex;
  gap: 0;
  flex: 1;
  overflow: hidden;
}
.editor-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.editor-col + .editor-col { border-left: 1px solid #e8e8e8; }
.editor-col-header {
  font-size: 11px;
  color: #999;
  padding: 4px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}
.editor-textarea {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px 12px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  resize: none;
  line-height: 1.5;
}
</style>
