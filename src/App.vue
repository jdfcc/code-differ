<script setup>
import { ref } from 'vue'
import Toolbar from './components/Toolbar/Toolbar.vue'
import ControlPanel from './components/ControlPanel/ControlPanel.vue'
import DiffViewer from './components/DiffViewer/DiffViewer.vue'
import InputEditor from './components/Editor/InputEditor.vue'

const diffViewer = ref(null)

function goToFirstDiff() {
  diffViewer.value?.goToFirstDiff()
}
</script>

<template>
  <div class="app-layout">
    <Toolbar />
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
</style>
