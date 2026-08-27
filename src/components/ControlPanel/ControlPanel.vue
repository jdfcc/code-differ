<script setup>
import { store } from '../../store/diff-store.js'
import { computed } from 'vue'

const languages = computed(() => {
  return ['auto', 'javascript', 'python', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'typescript', 'html', 'css', 'sql', 'json', 'xml', 'yaml', 'bash', 'php', 'ruby', 'swift', 'kotlin']
})

const emit = defineEmits(['goToFirstDiff'])
</script>

<template>
  <div class="control-panel">
    <h3 class="panel-title">设置</h3>

    <!-- 开关选项 -->
    <div class="control-group">
      <label class="switch-label">
        <span>折叠未更改行</span>
        <input type="checkbox" v-model="store.foldUnchangedLines" />
        <span class="switch-track"><span class="switch-thumb"></span></span>
      </label>
      <label class="switch-label">
        <span>自动换行</span>
        <input type="checkbox" v-model="store.wrapLines" />
        <span class="switch-track"><span class="switch-thumb"></span></span>
      </label>
    </div>

    <!-- 视图模式 -->
    <div class="control-group">
      <div class="control-label">视图</div>
      <div class="btn-group">
        <button
          :class="['btn-tab', store.viewMode === 'split' && 'active']"
          @click="store.viewMode = 'split'"
        >拆分</button>
        <button
          :class="['btn-tab', store.viewMode === 'unified' && 'active']"
          @click="store.viewMode = 'unified'"
        >统一</button>
      </div>
    </div>

    <!-- 比对精度 -->
    <div class="control-group">
      <div class="control-label">比对精度</div>
      <div class="btn-group">
        <button
          :class="['btn-tab', store.precision === 'word' && 'active']"
          @click="store.precision = 'word'"
        >单词</button>
        <button
          :class="['btn-tab', store.precision === 'char' && 'active']"
          @click="store.precision = 'char'"
        >字符</button>
      </div>
    </div>

    <!-- 语法高亮 -->
    <div class="control-group">
      <div class="control-label">语法高亮</div>
      <select v-model="store.syntaxLang" class="select-lang">
        <option v-for="lang in languages" :key="lang" :value="lang">
          {{ lang === 'auto' ? '自动检测' : lang }}
        </option>
      </select>
    </div>

    <!-- 忽略 -->
    <div class="control-group">
      <details>
        <summary class="control-label clickable">忽略</summary>
        <div class="sub-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="store.ignore.whitespace" /> 忽略空白
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="store.ignore.case" /> 忽略大小写
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="store.ignore.blankLines" /> 忽略空行
          </label>
        </div>
      </details>
    </div>

    <!-- 文本转换 -->
    <div class="control-group">
      <details>
        <summary class="control-label clickable">文本转换</summary>
        <div class="sub-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="store.transform.trimTrailing" /> 去除行尾空白
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="store.transform.normalizeWhitespace" /> 合并空白字符
          </label>
        </div>
      </details>
    </div>

    <!-- 导航 -->
    <button class="nav-btn" @click="$emit('goToFirstDiff')">
      → 转到第一个差异
    </button>

    <!-- 编辑输入 -->
    <button class="nav-btn edit-btn" @click="store.showEditor = !store.showEditor">
      ✎ {{ store.showEditor ? '关闭编辑' : '编辑输入' }}
    </button>
  </div>
</template>

<style scoped>
.control-panel {
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
}
.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.control-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}
.clickable {
  cursor: pointer;
  user-select: none;
  list-style: none;
}
.clickable::-webkit-details-marker { display: none; }
.clickable::before {
  content: '▶ ';
  font-size: 10px;
  display: inline-block;
  transition: transform 0.15s;
}
details[open] > .clickable::before { transform: rotate(90deg); }

/* Switch */
.switch-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  padding: 2px 0;
}
.switch-label input { display: none; }
.switch-track {
  width: 34px;
  height: 18px;
  background: #ddd;
  border-radius: 9px;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.switch-thumb {
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: left 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.switch-label input:checked + .switch-track {
  background: #10b981;
}
.switch-label input:checked + .switch-track .switch-thumb {
  left: 18px;
}

/* Button tabs */
.btn-group {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}
.btn-tab {
  flex: 1;
  padding: 5px 0;
  border: none;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  color: #666;
}
.btn-tab + .btn-tab { border-left: 1px solid #ddd; }
.btn-tab.active {
  background: #10b981;
  color: #fff;
}

.select-lang {
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  outline: none;
}

.sub-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0 0 4px;
}
.checkbox-label {
  font-size: 12px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.checkbox-label input {
  accent-color: #10b981;
}

.nav-btn {
  padding: 8px 0;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  color: #555;
  transition: all 0.15s;
}
.nav-btn:hover {
  background: #f0f0f0;
}
.edit-btn {
  margin-top: auto;
}
</style>
