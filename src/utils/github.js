const REPO = 'jdfcc/code-differ'
const API = 'https://api.github.com'

function getToken() {
  return import.meta.env.VITE_GITHUB_TOKEN || ''
}

// 创建 Issue，返回 issue number
export async function createShareIssue(title, oldText, newText) {
  const body = JSON.stringify({ old: oldText, new: newText })
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

  const parsed = JSON.parse(match[1])
  const title = data.title.replace(/^\[Share\]\s*/, '')
  return { old: parsed.old, new: parsed.new, title }
}
