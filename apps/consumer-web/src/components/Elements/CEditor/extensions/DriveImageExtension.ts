import { Node, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DRIVE_IMAGE_TAG_PATTERN } from '../utils/preprocessDriveImages'
import DriveImageComponent from '../components/DriveImage'

export interface DriveImageOptions {
  allowBase64: boolean
  HTMLAttributes: Record<string, any>
}

export interface DriveImageAttributes {
  driveUid: string
  imageUid: string
  alt?: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    driveImage: {
      insertDriveImage: (options: DriveImageAttributes) => ReturnType
    }
  }
}

const DriveImage = Node.create<DriveImageOptions>({
  name: 'driveImage',

  addOptions() {
    return {
      allowBase64: false,
      HTMLAttributes: {},
    }
  },

  inline: false,
  group: 'block',
  draggable: true,

  addAttributes() {
    return {
      driveUid: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-drive-uid'),
        renderHTML: (attributes) => {
          if (!attributes.driveUid) return {}
          return { 'data-drive-uid': attributes.driveUid }
        },
      },
      imageUid: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-image-uid'),
        renderHTML: (attributes) => {
          if (!attributes.imageUid) return {}
          return { 'data-image-uid': attributes.imageUid }
        },
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute('alt'),
        renderHTML: (attributes) => {
          if (!attributes.alt) return {}
          return { alt: attributes.alt }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-drive-image]',
        getAttrs: (element) => {
          const driveUid = (element as HTMLElement).getAttribute('data-drive-uid')
          const imageUid = (element as HTMLElement).getAttribute('data-image-uid')
          if (!driveUid || !imageUid) return false
          return {
            driveUid,
            imageUid,
            alt: (element as HTMLElement).getAttribute('data-alt') || `Drive image ${imageUid}`,
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = node?.attrs || HTMLAttributes
    const { driveUid, imageUid } = attrs
    if (driveUid && imageUid) {
      const tag = `[drive-image:${driveUid}:${imageUid}]`
      return ['p', {}, tag]
    }
    return ['p', {}, '[drive-image:invalid]']
  },

  addNodeView() {
    return ReactNodeViewRenderer(DriveImageComponent)
  },

  addCommands() {
    return {
      insertDriveImage:
        (options: DriveImageAttributes) =>
        ({ commands }) => {
          if (!options.driveUid || !options.imageUid) return false
          const attrs = {
            driveUid: options.driveUid,
            imageUid: options.imageUid,
            alt: options.alt || `Drive image ${options.imageUid}`,
          }
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: DRIVE_IMAGE_TAG_PATTERN,
        type: this.type,
        getAttributes: (match) => {
          const [, driveUid, imageUid] = match
          return {
            driveUid,
            imageUid,
            alt: `Drive image ${imageUid}`,
          }
        },
      }),
    ]
  },
})

export { DriveImage }
export default DriveImage
