import { Editor } from '@tiptap/react'

export interface DriveImageTag {
  fullMatch: string
  driveUid: string
  imageUid: string
  index: number
}

export const DRIVE_IMAGE_TAG_PATTERN = /\[drive-image:([^:]+):([^\]]+)\]/

export function findDriveImageTags(content: string): DriveImageTag[] {
  const tags: DriveImageTag[] = []
  let match
  const regex = new RegExp(DRIVE_IMAGE_TAG_PATTERN.source, 'g')

  while ((match = regex.exec(content)) !== null) {
    tags.push({
      fullMatch: match[0],
      driveUid: match[1],
      imageUid: match[2],
      index: match.index,
    })
  }
  return tags
}

export function cleanupHtmlContent(content: string): string {
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

export function preprocessDriveImageContent(content: string): string {
  const tags = findDriveImageTags(content)
  if (tags.length === 0) {
    return cleanupHtmlContent(content)
  }
  let processedContent = content
  for (let i = tags.length - 1; i >= 0; i--) {
    const tag = tags[i]
    const replacement = `<div data-drive-image="true" data-drive-uid="${tag.driveUid}" data-image-uid="${tag.imageUid}" data-alt="Drive image ${tag.imageUid}"></div>`
    processedContent = processedContent.slice(0, tag.index) + replacement + processedContent.slice(tag.index + tag.fullMatch.length)
  }
  return cleanupHtmlContent(processedContent)
}

export function hasDriveImageTags(content: string): boolean {
  return DRIVE_IMAGE_TAG_PATTERN.test(content)
}

export function getContentForDatabase(editor: Editor): string {
  const rawContent = editor.getHTML()
  return cleanupHtmlContent(rawContent)
}
