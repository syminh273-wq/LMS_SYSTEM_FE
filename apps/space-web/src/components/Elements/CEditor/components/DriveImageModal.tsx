import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/components/ui/dialog'

interface DriveImageModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (driveUid: string, imageUid: string, imageData: any) => void
}

const DriveImageModal: React.FC<DriveImageModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Drive Image</DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center text-gray-500">
          Drive integration is not available in this environment yet.
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DriveImageModal
