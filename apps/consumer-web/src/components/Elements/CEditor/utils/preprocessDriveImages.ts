function cleanupHtmlContent(content: string): string {
  if (!content) return content
  return content
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p>(\s|&nbsp;)*<\/p>/g, '')
    .replace(/<p>(<br\s*\/?>)*<\/p>/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/\n\s*<div/g, '\n<div')
    .replace(/<\/div>\s*\n/g, '</div>\n')
    .replace(/(<br\s*\/?>){3,}/g, '<br><br>')
    .trim()
}

export function prepareContentForEditor(content: string): string {
  if (!content || content.trim() === '') {
    return '<p></p>'
  }
  let prepared = cleanupHtmlContent(content)
  if (prepared && !prepared.match(/^<(p|div|h[1-6]|ul|ol|blockquote)/i)) {
    prepared = `<p>${prepared}</p>`
  }
  if (prepared && !prepared.match(/<\/p>$/i)) {
    if (!prepared.match(/<\/(div|h[1-6]|ul|ol|blockquote)>$/i)) {
      prepared = `${prepared}</p>`
      if (!prepared.match(/^<p>/i)) {
        prepared = `<p>${prepared}`
      }
    }
  }
  return prepared || '<p></p>'
}
