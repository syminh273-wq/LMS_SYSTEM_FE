import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import React from 'react'
import { cn } from '@shared/lib/utils'

interface DriveImageAttributes {
  driveUid: string
  imageUid: string
  alt?: string
}

const DriveImage: React.FC<NodeViewProps> = ({ node, selected }) => {
  const { driveUid, imageUid, alt } = (node.attrs as DriveImageAttributes) || {}

  if (!driveUid || !imageUid) {
    return (
      <NodeViewWrapper>
        <div className="flex items-center justify-center p-4 border-2 border-red-300 border-dashed rounded-lg bg-red-50">
          <div className="text-red-600 text-sm">Invalid drive image: Missing driveUid or imageUid</div>
        </div>
      </NodeViewWrapper>
    )
  }

  const renderDriveImageTag = () => `[drive-image:${driveUid}:${imageUid}]`

  return (
    <NodeViewWrapper>
      <div
        className={cn(
          'flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg',
          'bg-gray-50 text-gray-600 min-h-[150px] relative',
          selected && 'border-blue-500 bg-blue-50'
        )}
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-200 rounded-lg">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-sm font-medium mb-1">Drive Image (Placeholder)</div>
          <div className="text-xs text-gray-500 mb-2">{renderDriveImageTag()}</div>
          <div className="text-xs text-gray-400">
            Drive: {driveUid}
            <br />
            Image: {imageUid}
          </div>
        </div>
        {selected && <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">Selected</div>}
      </div>
    </NodeViewWrapper>
  )
}

export default DriveImage
