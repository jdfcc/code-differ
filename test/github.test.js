import test from 'node:test'
import assert from 'node:assert/strict'
import LZString from 'lz-string'
import { createShareIssue, loadShareIssue } from '../src/utils/github.js'

test('creates a compressed share issue and closes it', async t => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    calls.push({ url, options })
    return calls.length === 1
      ? { ok: true, json: async () => ({ number: 42 }) }
      : { ok: true }
  })

  assert.equal(await createShareIssue('demo', 'old', 'new'), 42)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].options.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[1].options.body), { state: 'closed' })
  const issue = JSON.parse(calls[0].options.body)
  assert.match(issue.body, /"version":2/)
})

test('loads compressed and legacy shares', async t => {
  const compressed = LZString.compressToBase64(JSON.stringify({ old: '旧', new: '新' }))
  const bodies = [
    `<!-- DIFF_DATA_START -->\n${JSON.stringify({ version: 2, compressed })}\n<!-- DIFF_DATA_END -->`,
    `<!-- DIFF_DATA_START -->\n${JSON.stringify({ old: 'a', new: 'b' })}\n<!-- DIFF_DATA_END -->`,
  ]
  let index = 0
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ title: '[Share] title', body: bodies[index++] }),
  }))

  assert.deepEqual(await loadShareIssue(1), { old: '旧', new: '新', title: 'title' })
  assert.deepEqual(await loadShareIssue(2), { old: 'a', new: 'b', title: 'title' })
})
