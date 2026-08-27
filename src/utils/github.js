const REPO = 'jdfcc/code-differ'
const API = 'https://api.github.com'

function getToken() {
  return import.meta.env?.VITE_GITHUB_TOKEN || ''
}

// 创建 Issue，返回 issue number
export async function createShareIssue(title, oldText, newText) {
  const module = await import('lz-string')
  const { compressToBase64 } = module.default || module
  const body = JSON.stringify({ version: 2, compressed: compressToBase64(JSON.stringify({ old: oldText, new: newText })) })
  const res = await fetch(`${API}/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `token ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `[Share] ${title || '未命名对比'}`,
      body: `<!-- DIFF_DATA_START -->\n${body}\n<!-- DIFF_DATA_END -->`,
      labels: ['share'],
    }),
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const data = await res.json()
  const closeRes = await fetch(`${API}/repos/${REPO}/issues/${data.number}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state: 'closed' }),
  })
  if (!closeRes.ok) throw new Error(`Issue 已创建，但自动关闭失败: ${closeRes.status}`)
  return data.number
}

// 读取 Issue 内容，解析出 diff 数据
export async function loadShareIssue(issueNumber) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `token ${token}`

  const res = await fetch(`${API}/repos/${REPO}/issues/${issueNumber}`, { headers })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const data = await res.json()

  const match = data.body.match(/<!-- DIFF_DATA_START -->\n([\s\S]*?)\n<!-- DIFF_DATA_END -->/)
  if (!match) throw new Error('Invalid share data')

  const payload = JSON.parse(match[1])
  let parsed = payload
  if (payload.version === 2 && payload.compressed) {
    const module = await import('lz-string')
    const { decompressFromBase64 } = module.default || module
    const json = decompressFromBase64(payload.compressed)
    if (!json) throw new Error('Invalid compressed share data')
    parsed = JSON.parse(json)
  }
  if (typeof parsed.old !== 'string' || typeof parsed.new !== 'string') throw new Error('Invalid share data')
  const title = data.title.replace(/^\[Share\]\s*/, '')
  return { old: parsed.old, new: parsed.new, title }
}
