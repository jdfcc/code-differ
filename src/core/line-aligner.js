/**
 * 将 classifyChanges 的结果转换为左右对齐的行数组
 * 每个元素: { left: { lineNo, content, type }, right: { lineNo, content, type } }
 */
export function alignLines(classifiedChanges) {
  const rows = []
  let leftLineNo = 1
  let rightLineNo = 1

  for (const chunk of classifiedChanges) {
    switch (chunk.type) {
      case 'unchanged':
        for (const line of chunk.lines) {
          rows.push({
            left: { lineNo: leftLineNo++, content: line, type: 'unchanged' },
            right: { lineNo: rightLineNo++, content: line, type: 'unchanged' },
          })
        }
        break

      case 'removed':
        for (const line of chunk.lines) {
          rows.push({
            left: { lineNo: leftLineNo++, content: line, type: 'removed' },
            right: { lineNo: null, content: '', type: 'placeholder' },
          })
        }
        break

      case 'added':
        for (const line of chunk.lines) {
          rows.push({
            left: { lineNo: null, content: '', type: 'placeholder' },
            right: { lineNo: rightLineNo++, content: line, type: 'added' },
          })
        }
        break

      case 'modified': {
        const maxLen = Math.max(chunk.oldLines.length, chunk.newLines.length)
        for (let i = 0; i < maxLen; i++) {
          const hasOld = i < chunk.oldLines.length
          const hasNew = i < chunk.newLines.length
          rows.push({
            left: hasOld
              ? { lineNo: leftLineNo++, content: chunk.oldLines[i], type: 'modified' }
              : { lineNo: null, content: '', type: 'placeholder' },
            right: hasNew
              ? { lineNo: rightLineNo++, content: chunk.newLines[i], type: 'modified' }
              : { lineNo: null, content: '', type: 'placeholder' },
          })
        }
        break
      }

      case 'eof':
        rows.push({
          left: chunk.oldHasFinalNewline
            ? { lineNo: null, content: '', type: 'placeholder' }
            : { lineNo: null, content: '\\ No newline at end of file', type: 'eof' },
          right: chunk.newHasFinalNewline
            ? { lineNo: null, content: '', type: 'placeholder' }
            : { lineNo: null, content: '\\ No newline at end of file', type: 'eof' },
        })
        break
    }
  }

  return rows
}

/**
 * 生成统一视图的行数组
 */
export function unifiedLines(classifiedChanges) {
  const rows = []
  let leftLineNo = 1
  let rightLineNo = 1

  for (const chunk of classifiedChanges) {
    switch (chunk.type) {
      case 'unchanged':
        for (const line of chunk.lines) {
          rows.push({
            leftLineNo: leftLineNo++,
            rightLineNo: rightLineNo++,
            content: line,
            type: 'unchanged',
          })
        }
        break

      case 'removed':
        for (const line of chunk.lines) {
          rows.push({
            leftLineNo: leftLineNo++,
            rightLineNo: null,
            content: line,
            type: 'removed',
          })
        }
        break

      case 'added':
        for (const line of chunk.lines) {
          rows.push({
            leftLineNo: null,
            rightLineNo: rightLineNo++,
            content: line,
            type: 'added',
          })
        }
        break

      case 'modified':
        for (const line of chunk.oldLines) {
          rows.push({
            leftLineNo: leftLineNo++,
            rightLineNo: null,
            content: line,
            type: 'removed',
          })
        }
        for (const line of chunk.newLines) {
          rows.push({
            leftLineNo: null,
            rightLineNo: rightLineNo++,
            content: line,
            type: 'added',
          })
        }
        break


      case 'eof':
        rows.push({
          leftLineNo: null,
          rightLineNo: null,
          content: '\\ No newline at end of file',
          type: 'eof',
          side: chunk.oldHasFinalNewline ? 'right' : 'left',
        })
        break
    }
  }

  return rows
}

/**
 * 折叠未更改行：连续超过 threshold 行的 unchanged 段只保留首尾各 contextLines 行
 */
export function foldUnchanged(rows, contextLines = 3, threshold = 7) {
  const result = []
  let i = 0

  while (i < rows.length) {
    if (rows[i].left?.type === 'unchanged' || rows[i].type === 'unchanged') {
      // 收集连续 unchanged
      const start = i
      while (
        i < rows.length &&
        (rows[i].left?.type === 'unchanged' || rows[i].type === 'unchanged')
      ) {
        i++
      }
      const count = i - start

      if (count > threshold) {
        // 保留首尾各 contextLines 行
        for (let j = start; j < start + contextLines && j < i; j++) {
          result.push(rows[j])
        }
        result.push({
          type: 'fold',
          count: count - contextLines * 2,
          startIndex: start + contextLines,
          endIndex: i - contextLines,
        })
        for (let j = i - contextLines; j < i; j++) {
          result.push(rows[j])
        }
      } else {
        for (let j = start; j < i; j++) {
          result.push(rows[j])
        }
      }
    } else {
      result.push(rows[i])
      i++
    }
  }

  return result
}
