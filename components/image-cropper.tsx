"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { RotateCcw, ZoomIn, ZoomOut, Move, Check, X } from 'lucide-react'

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  onCrop: (croppedImage: string) => void
  imageSrc: string
}

interface CropArea {
  x: number
  y: number
  scale: number
  rotation: number
}

export function ImageCropper({ isOpen, onClose, onCrop, imageSrc }: ImageCropperProps) {
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, scale: 1, rotation: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Reset crop area when image changes
  useEffect(() => {
    if (imageSrc) {
      setCropArea({ x: 0, y: 0, scale: 1, rotation: 0 })
      setImageLoaded(false)
    }
  }, [imageSrc])

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      setImageSize({ width: naturalWidth, height: naturalHeight })
      setImageLoaded(true)
      
      // Center the image initially
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const centerX = (containerRect.width - 200) / 2
        const centerY = (containerRect.height - 200) / 2
        setCropArea(prev => ({ ...prev, x: centerX, y: centerY }))
      }
    }
  }, [])

  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStart({ x: clientX - cropArea.x, y: clientY - cropArea.y })
  }

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setCropArea(prev => ({
      ...prev,
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    }))
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleMouseMove)
      document.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleMouseMove)
      document.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle zoom changes
  const handleZoomChange = (value: number[]) => {
    setCropArea(prev => ({ ...prev, scale: value[0] }))
  }

  // Handle rotation
  const handleRotate = () => {
    setCropArea(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))
  }

  // Crop the image
  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to the crop area (200x200 for circular avatar)
    canvas.width = 200
    canvas.height = 200

    // Create circular clipping path
    ctx.beginPath()
    ctx.arc(100, 100, 100, 0, 2 * Math.PI)
    ctx.clip()

    // Calculate the crop area
    const containerRect = containerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()
    
    // Calculate the actual image position and size
    const imageX = imageRect.left - containerRect.left + cropArea.x
    const imageY = imageRect.top - containerRect.top + cropArea.y
    const imageWidth = imageRect.width * cropArea.scale
    const imageHeight = imageRect.height * cropArea.scale

    // Draw the cropped image
    ctx.save()
    ctx.translate(100, 100)
    ctx.rotate((cropArea.rotation * Math.PI) / 180)
    ctx.drawImage(
      imageRef.current,
      imageX,
      imageY,
      imageWidth,
      imageHeight,
      -100,
      -100,
      200,
      200
    )
    ctx.restore()

    // Convert to data URL
    const croppedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onCrop(croppedImageDataUrl)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            Crop Profile Picture
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Instructions */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">How to crop your image:</p>
            <ul className="space-y-1 text-xs">
              <li>• Drag the image to position it within the circle</li>
              <li>• Use the zoom slider to adjust the size</li>
              <li>• Click the rotate button to rotate the image</li>
              <li>• The image will be cropped to a perfect circle</li>
            </ul>
          </div>

          {/* Image Cropping Area */}
          <div 
            ref={containerRef}
            className="relative w-full h-80 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            {/* Crop Circle Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-full border-2 border-white shadow-lg bg-transparent"></div>
            </div>

            {/* Image */}
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className={`absolute transition-transform duration-200 ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{
                  transform: `translate(${cropArea.x}px, ${cropArea.y}px) scale(${cropArea.scale}) rotate(${cropArea.rotation}deg)`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </span>
                <span className="text-muted-foreground">
                  {Math.round(cropArea.scale * 100)}%
                </span>
              </div>
              <Slider
                value={[cropArea.scale]}
                onValueChange={handleZoomChange}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Rotate
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCrop}
                  disabled={!imageLoaded}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Apply Crop
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 