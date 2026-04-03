import { store, stats } from '../store/diff-store.js'
import diffLibRaw from '../core/diff-lib.min.js?raw'
import diffEngineRaw from '../core/diff-engine.js?raw'
import lineAlignerRaw from '../core/line-aligner.js?raw'
import textTransformRaw from '../core/text-transform.js?raw'

function esc(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const EXPORT_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; width: 100%; overflow: hidden; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; }
.app-layout { height: 100%; display: flex; flex-direction: column; }

/* Toolbar */
.toolbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #fff; border-bottom: 1px solid #e8e8e8; gap: 16px; flex-shrink: 0; }
.toolbar-left { display: flex; align-items: center; gap: 12px; }
.title-display { font-size: 16px; font-weight: 600; }
.toolbar-center { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.stat-removed { color: #e74c3c; }
.stat-added { color: #27ae60; }
.stat-icon { font-weight: 700; }
.stat-separator { color: #ddd; }
.toolbar-right { display: flex; align-items: center; gap: 8px; }
.tb-btn { padding: 6px 16px; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; transition: all 0.15s; }
.tb-btn:hover { background: #f5f5f5; }

/* Control panel */
.control-panel { width: 200px; min-width: 200px; background: #fafafa; border-right: 1px solid #e8e8e8; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; }
.panel-title { font-size: 14px; font-weight: 600; margin: 0 0 4px 0; color: #333; }
.control-group { display: flex; flex-direction: column; gap: 6px; }
.control-label { font-size: 12px; color: #666; font-weight: 500; }
.switch-label { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #555; cursor: pointer; padding: 2px 0; }
.switch-label input { display: none; }
.switch-track { width: 34px; height: 18px; background: #ddd; border-radius: 9px; position: relative; transition: background 0.2s; flex-shrink: 0; }
.switch-thumb { width: 14px; height: 14px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: left 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.switch-label input:checked + .switch-track { background: #10b981; }
.switch-label input:checked + .switch-track .switch-thumb { left: 18px; }
.btn-group { display: flex; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
.btn-tab { flex: 1; padding: 5px 0; border: none; background: #fff; font-size: 12px; cursor: pointer; transition: all 0.15s; color: #666; }
.btn-tab + .btn-tab { border-left: 1px solid #ddd; }
.btn-tab.active { background: #10b981; color: #fff; }
.clickable { cursor: pointer; user-select: none; list-style: none; }
.clickable::-webkit-details-marker { display: none; }
.clickable::before { content: '\\25B6  '; font-size: 10px; display: inline-block; transition: transform 0.15s; }
details[open] > .clickable::before { transform: rotate(90deg); }
.sub-options { display: flex; flex-direction: column; gap: 4px; padding: 6px 0 0 4px; }
.checkbox-label { font-size: 12px; color: #555; display: flex; align-items: center; gap: 6px; cursor: pointer; }
.checkbox-label input { accent-color: #10b981; }
.nav-btn { padding: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; font-size: 12px; color: #555; transition: all 0.15s; }
.nav-btn:hover { background: #f0f0f0; }

/* App body & diff viewer */
.app-body { flex: 1; display: flex; overflow: hidden; }
.diff-viewer { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #fff; }
.pane-headers { display: flex; border-bottom: 1px solid #e8e8e8; flex-shrink: 0; }
.pane-header { flex: 1; display: flex; align-items: center; gap: 10px; padding: 6px 16px; font-size: 12px; color: #888; background: #fafafa; }
.pane-header-left { border-right: 1px solid #e8e8e8; }
.pane-badge { padding: 1px 8px; border-radius: 3px; font-size: 11px; font-weight: 500; }
.removed-badge { background: #fdd; color: #c0392b; }
.added-badge { background: #d4edda; color: #27ae60; }
.pane-stat { color: #aaa; }
.copy-btn { margin-left: auto; border: 1px solid #ddd; background: #fff; padding: 2px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; color: #666; }
.copy-btn:hover { background: #f5f5f5; }
.split-container { flex: 1; display: flex; overflow: hidden; }
.code-pane { flex: 1; overflow: auto; border-right: 1px solid #e8e8e8; }
.code-pane:last-child { border-right: none; }
.diff-table { width: 100%; border-collapse: collapse; font-family: 'Cascadia Code', 'Fira Code', Consolas, Monaco, monospace; font-size: 13px; line-height: 21px; table-layout: fixed; }
.line-no { width: 50px; min-width: 50px; text-align: right; padding: 0 8px; color: #aaa; user-select: none; background: inherit; border-right: 1px solid #eee; vertical-align: top; font-size: 12px; }
.line-content { padding: 0 12px; white-space: pre; overflow: hidden; height: 21px; line-height: 21px; }
.wrap-lines .line-content { white-space: pre-wrap; word-break: break-all; height: auto; }
.line-unchanged { background: #fff; }
.line-removed { background: #fff0f0; }
.line-added { background: #f0fff0; }
.line-placeholder { background: #f8f8f8; }
.code-pane:first-child .line-modified { background: #fff0f0; }
.code-pane:last-child .line-modified { background: #f0fff0; }
tr.line-removed .line-no { background: #ffe0e0; color: #c0392b; }
tr.line-added .line-no { background: #d4edda; color: #27ae60; }
.code-pane:first-child tr.line-modified .line-no { background: #ffe0e0; color: #c0392b; }
.code-pane:last-child tr.line-modified .line-no { background: #d4edda; color: #27ae60; }
.inline-removed { background: #ffb3b3; border-radius: 2px; }
.inline-added { background: #90ee90; border-radius: 2px; }
.fold-row { cursor: pointer; }
.fold-row:hover .fold-cell { background: #e0ecff; }
.fold-cell { text-align: center; padding: 6px 0; background: #f0f5ff; color: #4a90d9; font-size: 12px; border-top: 1px solid #d6e4f0; border-bottom: 1px solid #d6e4f0; height: 21px; line-height: 9px; }
.unified-container { flex: 1; overflow: auto; }
.unified-table .line-no { width: 45px; min-width: 45px; }

/* Editor */
.editor-panel { border-top: 1px solid #e8e8e8; background: #fff; flex-shrink: 0; }
.editor-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; font-size: 13px; font-weight: 500; color: #555; border-bottom: 1px solid #f0f0f0; }
.close-btn { border: none; background: none; font-size: 18px; cursor: pointer; color: #999; padding: 0 4px; }
.close-btn:hover { color: #333; }
.editor-body { display: flex; gap: 0; height: 200px; }
.editor-col { flex: 1; display: flex; flex-direction: column; }
.editor-col + .editor-col { border-left: 1px solid #e8e8e8; }
.editor-col-header { font-size: 11px; color: #999; padding: 4px 12px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
.editor-textarea { flex: 1; border: none; outline: none; padding: 8px 12px; font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace; font-size: 12px; resize: none; line-height: 1.5; }
`

// Transform ES module source to plain functions accessible in global scope
function buildCoreBundle() {
  // diff.min.js is UMD and attaches to `Diff` global (or exports)
  // We wrap it to ensure `Diff` is available globally
  const diffLib = `// diff library\n;(function(){${diffLibRaw}})();\n`

  // Transform our ES modules: strip import/export, use global Diff
  const textTransform = textTransformRaw
    .replace(/^export\s+/gm, '')

  const diffEngine = diffEngineRaw
    .replace(/^import\s.*$/gm, '')
    .replace(/^export\s+/gm, '')
    .replace(/\bdiffLines\b/g, 'Diff.diffLines')
    .replace(/\bdiffWords\b/g, 'Diff.diffWords')
    .replace(/\bdiffChars\b/g, 'Diff.diffChars')

  const lineAligner = lineAlignerRaw
    .replace(/^export\s+/gm, '')

  return `${diffLib}
// text-transform
${textTransform}
// diff-engine
${diffEngine}
// line-aligner
${lineAligner}`
}

// The main app logic that runs in the exported HTML
const APP_SCRIPT = `
var state = {
  oldText: '',
  newText: '',
  title: '',
  viewMode: 'split',
  precision: 'word',
  foldUnchangedLines: false,
  wrapLines: false,
  showEditor: false,
  ignore: { whitespace: false, case: false, blankLines: false },
  transform: { trimTrailing: false, normalizeWhitespace: false },
};

function loadState() {
  var d = JSON.parse(document.getElementById('app-data').textContent);
  state.oldText = decodeURIComponent(escape(atob(d.oldText)));
  state.newText = decodeURIComponent(escape(atob(d.newText)));
  state.title = d.title;
  state.viewMode = d.viewMode;
  state.precision = d.precision;
  state.foldUnchangedLines = d.foldUnchangedLines;
  state.wrapLines = d.wrapLines;
  state.ignore = d.ignore;
  state.transform = d.transform;
  state.share = d.share || {};
}

function esc(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function computeDiff() {
  var opts = {
    trimTrailingWhitespace: state.transform.trimTrailing,
    normalizeWhitespace: state.transform.normalizeWhitespace || state.ignore.whitespace,
    toLowerCase: state.ignore.case,
    removeBlankLines: state.ignore.blankLines,
  };
  var oldT = transformText(state.oldText, opts);
  var newT = transformText(state.newText, opts);
  var changes = computeLineDiff(oldT, newT, { ignoreWhitespace: state.ignore.whitespace });
  return classifyChanges(changes);
}

function renderInline(oldC, newC, side) {
  if (!oldC && !newC) return '';
  var parts = computeInlineDiff(oldC || '', newC || '', state.precision);
  var h = '';
  for (var p of parts) {
    var e = esc(p.value);
    if (side === 'left' && p.removed) h += '<span class="inline-removed">' + e + '</span>';
    else if (side === 'right' && p.added) h += '<span class="inline-added">' + e + '</span>';
    else if (!p.added && !p.removed) h += e;
  }
  return h;
}

function renderSplit(rows) {
  var lh = '', rh = '';
  for (var row of rows) {
    if (row.type === 'fold') {
      var f = '<tr class="fold-row" onclick="state.foldUnchangedLines=false;render()"><td colspan="2" class="fold-cell">\\u22ef \\u5c55\\u5f00 ' + row.count + ' \\u884c\\u672a\\u66f4\\u6539 \\u22ef</td></tr>';
      lh += f; rh += f; continue;
    }
    var lc = row.left, rc = row.right;
    var lContent = '', rContent = '';
    if (lc && lc.type !== 'placeholder') {
      lContent = (lc.type === 'modified' && rc && rc.type === 'modified')
        ? renderInline(lc.content, rc.content, 'left') : esc(lc.content);
    }
    if (rc && rc.type !== 'placeholder') {
      rContent = (rc.type === 'modified' && lc && lc.type === 'modified')
        ? renderInline(lc.content, rc.content, 'right') : esc(rc.content);
    }
    lh += '<tr class="line-' + (lc ? lc.type : '') + '"><td class="line-no">' + (lc && lc.lineNo != null ? lc.lineNo : '') + '</td><td class="line-content">' + lContent + '</td></tr>';
    rh += '<tr class="line-' + (rc ? rc.type : '') + '"><td class="line-no">' + (rc && rc.lineNo != null ? rc.lineNo : '') + '</td><td class="line-content">' + rContent + '</td></tr>';
  }
  return { left: lh, right: rh };
}

function renderUnified(rows) {
  var h = '';
  for (var row of rows) {
    if (row.type === 'fold') {
      h += '<tr class="fold-row" onclick="state.foldUnchangedLines=false;render()"><td colspan="3" class="fold-cell">\\u22ef \\u5c55\\u5f00 ' + row.count + ' \\u884c\\u672a\\u66f4\\u6539 \\u22ef</td></tr>';
      continue;
    }
    h += '<tr class="line-' + row.type + '"><td class="line-no">' + (row.leftLineNo != null ? row.leftLineNo : '') + '</td><td class="line-no">' + (row.rightLineNo != null ? row.rightLineNo : '') + '</td><td class="line-content">' + esc(row.content) + '</td></tr>';
  }
  return h;
}

function countStats(classified) {
  var added = 0, removed = 0, oldLines = 0, newLines = 0;
  for (var c of classified) {
    if (c.type === 'unchanged') { oldLines += c.lines.length; newLines += c.lines.length; }
    else if (c.type === 'removed') { removed += c.lines.length; oldLines += c.lines.length; }
    else if (c.type === 'added') { added += c.lines.length; newLines += c.lines.length; }
    else if (c.type === 'modified') { removed += c.oldLines.length; added += c.newLines.length; oldLines += c.oldLines.length; newLines += c.newLines.length; }
  }
  return { added: added, removed: removed, oldLines: oldLines, newLines: newLines };
}

function render() {
  var classified = computeDiff();
  var st = countStats(classified);
  document.getElementById('stat-removed').textContent = '\\u2212 ' + st.removed + ' \\u5220\\u9664';
  document.getElementById('stat-added').textContent = '+ ' + st.added + ' \\u6dfb\\u52a0';

  var splitRows = alignLines(classified);
  var uniRows = unifiedLines(classified);
  if (state.foldUnchangedLines) {
    splitRows = foldUnchanged(splitRows);
    uniRows = foldUnchanged(uniRows);
  }

  var viewer = document.getElementById('diff-viewer');
  var wrapClass = state.wrapLines ? ' wrap-lines' : '';

  if (state.viewMode === 'split') {
    var r = renderSplit(splitRows);
    viewer.innerHTML =
      '<div class="pane-headers"><div class="pane-header pane-header-left"><span class="pane-badge removed-badge">\\u5220\\u9664</span><span class="pane-stat">' + st.oldLines + ' \\u884c</span><button class="copy-btn" onclick="copyText(\\'old\\')">\\u5168\\u90e8\\u590d\\u5236</button></div><div class="pane-header pane-header-right"><span class="pane-badge added-badge">\\u6dfb\\u52a0</span><span class="pane-stat">' + st.newLines + ' \\u884c</span><button class="copy-btn" onclick="copyText(\\'new\\')">\\u5168\\u90e8\\u590d\\u5236</button></div></div>' +
      '<div class="split-container"><div class="code-pane' + wrapClass + '" id="leftPane"><table class="diff-table"><tbody>' + r.left + '</tbody></table></div><div class="code-pane' + wrapClass + '" id="rightPane"><table class="diff-table"><tbody>' + r.right + '</tbody></table></div></div>';
    setupScrollSync();
  } else {
    var u = renderUnified(uniRows);
    viewer.innerHTML =
      '<div class="unified-container' + wrapClass + '"><table class="diff-table unified-table"><tbody>' + u + '</tbody></table></div>';
  }

  // Update control panel active states
  document.querySelectorAll('[data-view]').forEach(function(b) {
    b.classList.toggle('active', b.dataset.view === state.viewMode);
  });
  document.querySelectorAll('[data-prec]').forEach(function(b) {
    b.classList.toggle('active', b.dataset.prec === state.precision);
  });
  document.getElementById('chk-fold').checked = state.foldUnchangedLines;
  document.getElementById('chk-wrap').checked = state.wrapLines;
  document.getElementById('chk-ign-ws').checked = state.ignore.whitespace;
  document.getElementById('chk-ign-case').checked = state.ignore.case;
  document.getElementById('chk-ign-blank').checked = state.ignore.blankLines;
  document.getElementById('chk-trim').checked = state.transform.trimTrailing;
  document.getElementById('chk-norm').checked = state.transform.normalizeWhitespace;

  // Update editor
  var ep = document.getElementById('editor-panel');
  ep.style.display = state.showEditor ? '' : 'none';
  if (state.showEditor) {
    document.getElementById('ta-old').value = state.oldText;
    document.getElementById('ta-new').value = state.newText;
  }
  document.getElementById('btn-editor').textContent = state.showEditor ? '\\u2710 \\u5173\\u95ed\\u7f16\\u8f91' : '\\u2710 \\u7f16\\u8f91\\u8f93\\u5165';
}

var _syncing = false;
function setupScrollSync() {
  var l = document.getElementById('leftPane');
  var r = document.getElementById('rightPane');
  if (!l || !r) return;
  function sync(a, b) {
    if (_syncing) return;
    _syncing = true;
    b.scrollTop = a.scrollTop;
    b.scrollLeft = a.scrollLeft;
    requestAnimationFrame(function() { _syncing = false; });
  }
  l.onscroll = function() { sync(l, r); };
  r.onscroll = function() { sync(r, l); };
}

function copyText(which) {
  var t = which === 'old' ? state.oldText : state.newText;
  navigator.clipboard.writeText(t).then(function() { alert('\\u5df2\\u590d\\u5236\\u5230\\u526a\\u8d34\\u677f'); });
}

function setView(v) { state.viewMode = v; render(); }
function setPrec(p) { state.precision = p; render(); }
function toggleFold(el) { state.foldUnchangedLines = el.checked; render(); }
function toggleWrap(el) { state.wrapLines = el.checked; render(); }
function toggleIgnWs(el) { state.ignore.whitespace = el.checked; render(); }
function toggleIgnCase(el) { state.ignore.case = el.checked; render(); }
function toggleIgnBlank(el) { state.ignore.blankLines = el.checked; render(); }
function toggleTrim(el) { state.transform.trimTrailing = el.checked; render(); }
function toggleNorm(el) { state.transform.normalizeWhitespace = el.checked; render(); }

function toggleEditor() {
  state.showEditor = !state.showEditor;
  render();
}
function onOldInput(el) { state.oldText = el.value; render(); }
function onNewInput(el) { state.newText = el.value; render(); }

function goToFirstDiff() {
  var rows, pane;
  if (state.viewMode === 'split') {
    pane = document.getElementById('leftPane');
    if (!pane) return;
    var trs = pane.querySelectorAll('tr');
    for (var i = 0; i < trs.length; i++) {
      var cls = trs[i].className;
      if (cls.indexOf('line-removed') >= 0 || cls.indexOf('line-added') >= 0 || cls.indexOf('line-modified') >= 0) {
        trs[i].scrollIntoView({ block: 'center' });
        return;
      }
    }
  } else {
    pane = document.querySelector('.unified-container');
    if (!pane) return;
    var trs = pane.querySelectorAll('tr');
    for (var i = 0; i < trs.length; i++) {
      var cls = trs[i].className;
      if (cls.indexOf('line-removed') >= 0 || cls.indexOf('line-added') >= 0) {
        trs[i].scrollIntoView({ block: 'center' });
        return;
      }
    }
  }
}

var _sharing = false;
function shareDiff() {
  if (_sharing) return;
  if (!state.share.token) { alert('\\u672a\\u914d\\u7f6e GitHub Token\\uff0c\\u65e0\\u6cd5\\u5206\\u4eab'); return; }
  if (!state.share.baseUrl) { alert('\\u672a\\u914d\\u7f6e\\u5206\\u4eab\\u57fa\\u7840\\u5730\\u5740 (VITE_SHARE_BASE_URL)\\uff0c\\u65e0\\u6cd5\\u5206\\u4eab'); return; }
  if (!state.title.trim()) { alert('\\u8bf7\\u5148\\u8f93\\u5165\\u6807\\u9898\\u518d\\u5206\\u4eab'); return; }
  _sharing = true;
  var btn = document.getElementById('btn-share');
  btn.textContent = '\\u5206\\u4eab\\u4e2d...';
  btn.disabled = true;
  var body = JSON.stringify({ old: state.oldText, new: state.newText });
  fetch('https://api.github.com/repos/' + state.share.repo + '/issues', {
    method: 'POST',
    headers: { 'Authorization': 'token ' + state.share.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '[Share] ' + (state.title || '\\u672a\\u547d\\u540d\\u5bf9\\u6bd4'),
      body: '<!-- DIFF_DATA_START -->\\n' + body + '\\n<!-- DIFF_DATA_END -->',
      labels: ['share'],
    }),
  }).then(function(res) {
    if (!res.ok) throw new Error('GitHub API error: ' + res.status);
    return res.json();
  }).then(function(data) {
    var url = state.share.baseUrl.replace(/\\/+$/, '') + '#issue=' + data.number;
    return navigator.clipboard.writeText(url).then(function() {
      alert('\\u5206\\u4eab\\u94fe\\u63a5\\u5df2\\u590d\\u5236\\u5230\\u526a\\u8d34\\u677f');
    });
  }).catch(function(e) {
    alert('\\u5206\\u4eab\\u5931\\u8d25\\uff1a' + e.message);
  }).finally(function() {
    _sharing = false;
    btn.textContent = '\\u5206\\u4eab';
    btn.disabled = false;
  });
}

window.onload = function() { loadState(); render(); };
`

export function exportFullHtml() {
  const title = esc(store.title || 'diff')

  // Encode raw texts
  const appData = {
    oldText: btoa(unescape(encodeURIComponent(store.oldText))),
    newText: btoa(unescape(encodeURIComponent(store.newText))),
    title: store.title || '',
    viewMode: store.viewMode,
    precision: store.precision,
    foldUnchangedLines: store.foldUnchangedLines,
    wrapLines: store.wrapLines,
    ignore: { ...store.ignore },
    transform: { ...store.transform },
    share: {
      token: import.meta.env.VITE_GITHUB_TOKEN || '',
      repo: 'jdfcc/code-differ',
      baseUrl: import.meta.env.VITE_SHARE_BASE_URL || '',
    },
  }

  const coreBundle = buildCoreBundle()

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - Code Differ</title>
<style>${EXPORT_CSS}</style>
</head>
<body>
<div class="app-layout">
  <div class="toolbar">
    <div class="toolbar-left">
      <span class="title-display">${title}</span>
    </div>
    <div class="toolbar-center">
      <span class="stat stat-removed" id="stat-removed"></span>
      <span class="stat-separator">|</span>
      <span class="stat stat-added" id="stat-added"></span>
    </div>
    <div class="toolbar-right">
      <button class="tb-btn" id="btn-share" onclick="shareDiff()">分享</button>
      <span style="font-size:11px;color:#bbb;">离线版</span>
    </div>
  </div>
  <div class="app-body">
    <div class="control-panel">
      <h3 class="panel-title">设置</h3>
      <div class="control-group">
        <label class="switch-label"><span>折叠未更改行</span><input type="checkbox" id="chk-fold" onchange="toggleFold(this)"><span class="switch-track"><span class="switch-thumb"></span></span></label>
        <label class="switch-label"><span>自动换行</span><input type="checkbox" id="chk-wrap" onchange="toggleWrap(this)"><span class="switch-track"><span class="switch-thumb"></span></span></label>
      </div>
      <div class="control-group">
        <div class="control-label">视图</div>
        <div class="btn-group">
          <button class="btn-tab" data-view="split" onclick="setView('split')">拆分</button>
          <button class="btn-tab" data-view="unified" onclick="setView('unified')">统一</button>
        </div>
      </div>
      <div class="control-group">
        <div class="control-label">比对精度</div>
        <div class="btn-group">
          <button class="btn-tab" data-prec="word" onclick="setPrec('word')">单词</button>
          <button class="btn-tab" data-prec="char" onclick="setPrec('char')">字符</button>
        </div>
      </div>
      <div class="control-group">
        <details>
          <summary class="control-label clickable">忽略</summary>
          <div class="sub-options">
            <label class="checkbox-label"><input type="checkbox" id="chk-ign-ws" onchange="toggleIgnWs(this)"> 忽略空白</label>
            <label class="checkbox-label"><input type="checkbox" id="chk-ign-case" onchange="toggleIgnCase(this)"> 忽略大小写</label>
            <label class="checkbox-label"><input type="checkbox" id="chk-ign-blank" onchange="toggleIgnBlank(this)"> 忽略空行</label>
          </div>
        </details>
      </div>
      <div class="control-group">
        <details>
          <summary class="control-label clickable">文本转换</summary>
          <div class="sub-options">
            <label class="checkbox-label"><input type="checkbox" id="chk-trim" onchange="toggleTrim(this)"> 去除行尾空白</label>
            <label class="checkbox-label"><input type="checkbox" id="chk-norm" onchange="toggleNorm(this)"> 合并空白字符</label>
          </div>
        </details>
      </div>
      <button class="nav-btn" onclick="goToFirstDiff()">\u2192 转到第一个差异</button>
      <button class="nav-btn" id="btn-editor" onclick="toggleEditor()" style="margin-top:auto;">\u270E 编辑输入</button>
    </div>
    <div class="diff-viewer" id="diff-viewer"></div>
  </div>
  <div class="editor-panel" id="editor-panel" style="display:none;">
    <div class="editor-header"><span>编辑输入</span><button class="close-btn" onclick="state.showEditor=false;render();">\u00d7</button></div>
    <div class="editor-body">
      <div class="editor-col"><div class="editor-col-header">原始文本</div><textarea class="editor-textarea" id="ta-old" oninput="onOldInput(this)" spellcheck="false" placeholder="粘贴原始文本..."></textarea></div>
      <div class="editor-col"><div class="editor-col-header">修改文本</div><textarea class="editor-textarea" id="ta-new" oninput="onNewInput(this)" spellcheck="false" placeholder="粘贴修改后的文本..."></textarea></div>
    </div>
  </div>
</div>
<script id="app-data" type="application/json">${JSON.stringify(appData).replace(/</g, '\\u003c')}</script>
<script>${coreBundle}</script>
<script>${APP_SCRIPT}</script>
</body>
</html>`
}
