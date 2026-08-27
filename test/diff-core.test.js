import test from 'node:test'
import assert from 'node:assert/strict'
import { computeLineDiff, classifyChanges, computeInlineDiff } from '../src/core/diff-engine.js'
import { alignLines, unifiedLines, foldUnchanged } from '../src/core/line-aligner.js'
import { transformText } from '../src/core/text-transform.js'

test('classifies a replacement and aligns both sides', () => {
  const result = classifyChanges(computeLineDiff('hello world', 'hello Vue'))
  assert.equal(result[0].type, 'modified')
  const rows = alignLines(result)
  assert.equal(rows[0].left.content, 'hello world')
  assert.equal(rows[0].right.content, 'hello Vue')
})

test('aligns a pure addition as a right-side added row', () => {
  const rows = alignLines(classifyChanges(computeLineDiff('', 'added')))
  assert.equal(rows[0].left.type, 'placeholder')
  assert.equal(rows[0].right.type, 'added')
})

test('renders end-of-file newline markers in both view models', () => {
  const eof = [{ type: 'eof', oldHasFinalNewline: true, newHasFinalNewline: false }]
  assert.equal(alignLines(eof)[0].right.type, 'eof')
  assert.equal(unifiedLines(eof)[0].side, 'right')
})

test('folds only the middle of long unchanged ranges', () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({ left: { type: 'unchanged', lineNo: i + 1 } }))
  const folded = foldUnchanged(rows)
  assert.equal(folded[3].type, 'fold')
  assert.equal(folded[3].count, 4)
})

test('text transforms and inline precision work', () => {
  assert.equal(transformText(' A  B  \n\n', { normalizeWhitespace: true, toLowerCase: true, removeBlankLines: true }), ' a b ')
  assert.ok(computeInlineDiff('cat', 'cut', 'char').some(part => part.added))
})
