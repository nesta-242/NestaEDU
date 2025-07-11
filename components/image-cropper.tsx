"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { ZoomIn, ZoomOut, Move, Check, X } from 'lucide-react'

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  onCrop: (croppedImage: string) => void
  imageSrc: string
}

interface ImagePosition {
  x: number
  y: number
  scale: number
}

export function ImageCropper({ isOpen, onClose, onCrop, imageSrc }: ImageCropperProps) {
  const [position, setPosition] = useState<ImagePosition>({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [cropperSize, setCropperSize] = useState({ width: 400, height: 400 })
  const [isMobile, setIsMobile] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Reset position when image changes
  useEffect(() => {
    if (imageSrc) {
      setPosition({ x: 0, y: 0, scale: 1 })
      setImageLoaded(false)
    }
  }, [imageSrc])

  // Handle image load and center it initially
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageLoaded(true)
      const imageWidth = imageRef.current.naturalWidth
      const imageHeight = imageRef.current.naturalHeight
      
      // Responsive max bounds
      const maxWidth = isMobile ? window.innerWidth - 40 : 600 // Mobile: full width minus padding
      const maxHeight = isMobile ? window.innerHeight * 0.5 : 500 // Mobile: 50% of viewport height
      
      let cropWidth = maxWidth
      let cropHeight = maxHeight
      const aspectRatio = imageWidth / imageHeight
      
      if (aspectRatio > 1) {
        cropWidth = Math.min(maxWidth, imageWidth)
        cropHeight = cropWidth / aspectRatio
        if (cropHeight > maxHeight) {
          cropHeight = maxHeight
          cropWidth = cropHeight * aspectRatio
        }
      } else {
        cropHeight = Math.min(maxHeight, imageHeight)
        cropWidth = cropHeight * aspectRatio
        if (cropWidth > maxWidth) {
          cropWidth = maxWidth
          cropHeight = cropWidth / aspectRatio
        }
      }
      
      setCropperSize({ width: cropWidth, height: cropHeight })
      
      // Center and scale image to cover cropper area
      const scale = Math.max(cropWidth / imageWidth, cropHeight / imageHeight)
      setPosition({ x: 0, y: 0, scale })
    }
  }, [isMobile])

  // Handle refocusing from existing avatar
  useEffect(() => {
    if (isOpen && imageSrc && imageLoaded) {
      const isRefocus = imageSrc.includes('data:image/jpeg') || imageSrc.includes('data:image/png')
      
      if (isRefocus && imageRef.current && containerRef.current) {
        const imageWidth = imageRef.current.naturalWidth
        const imageHeight = imageRef.current.naturalHeight
        
        const containerRect = containerRef.current.getBoundingClientRect()
        const containerWidth = containerRect.width
        const containerHeight = containerRect.height
        
        const scaleX = containerWidth / imageWidth
        const scaleY = containerHeight / imageHeight
        const refocusScale = Math.min(scaleX, scaleY)
        
        const scaledWidth = imageWidth * refocusScale
        const scaledHeight = imageHeight * refocusScale
        const centerX = (containerWidth - scaledWidth) / 2
        const centerY = (containerHeight - scaledHeight) / 2
        
        setPosition({ x: centerX, y: centerY, scale: refocusScale })
      }
    }
  }, [isOpen, imageSrc, imageLoaded])

  // Handle mouse/touch events for dragging the image
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    
    const offsetX = clientX - containerRect.left
    const offsetY = clientY - containerRect.top
    
    setDragStart({ x: offsetX - position.x, y: offsetY - position.y })
  }

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return
    
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const containerRect = containerRef.current.getBoundingClientRect()
    
    const newX = clientX - containerRect.left - dragStart.x
    const newY = clientY - containerRect.top - dragStart.y
    
    setPosition(prev => ({
      ...prev,
      x: newX,
      y: newY
    }))
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleMouseMove, { passive: false })
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
    setPosition(prev => ({ ...prev, scale: value[0] }))
  }

  // Calculate initial scale for zoom slider
  const getInitialScale = () => {
    if (!imageRef.current || !containerRef.current) return 1
    
    const imageWidth = imageRef.current.naturalWidth
    const imageHeight = imageRef.current.naturalHeight
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const scaleX = containerRect.width / imageWidth
    const scaleY = containerRect.height / imageHeight
    return Math.min(scaleX, scaleY)
  }

  const initialScale = getInitialScale()

  // Apply the focused image
  const handleApply = () => {
    if (!imageRef.current || !containerRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to the avatar size (200x200 for circular avatar)
    canvas.width = 200
    canvas.height = 200

    // Create circular clipping path
    ctx.beginPath()
    ctx.arc(100, 100, 100, 0, 2 * Math.PI)
    ctx.clip()

    // Get DOM rects
    const cropperRect = containerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()
    const imageWidth = imageRef.current.naturalWidth
    const imageHeight = imageRef.current.naturalHeight

    // The overlay is always centered and 80% of the smallest cropper dimension
    const overlayDiameter = Math.min(cropperRect.width, cropperRect.height) * 0.8
    const overlayRadius = overlayDiameter / 2
    const overlayCenterX = cropperRect.left + cropperRect.width / 2
    const overlayCenterY = cropperRect.top + cropperRect.height / 2

    // Overlay bounding box in viewport coordinates
    const overlayLeft = overlayCenterX - overlayRadius
    const overlayTop = overlayCenterY - overlayRadius
    const overlayRight = overlayCenterX + overlayRadius
    const overlayBottom = overlayCenterY + overlayRadius

    // Image bounding box in viewport coordinates
    // Map overlay box to image box
    // Calculate intersection of overlay and image in viewport
    const intersectLeft = Math.max(overlayLeft, imageRect.left)
    const intersectTop = Math.max(overlayTop, imageRect.top)
    const intersectRight = Math.min(overlayRight, imageRect.right)
    const intersectBottom = Math.min(overlayBottom, imageRect.bottom)

    const intersectWidth = Math.max(0, intersectRight - intersectLeft)
    const intersectHeight = Math.max(0, intersectBottom - intersectTop)

    // Map intersection box to image coordinates
    const xInImage = ((intersectLeft - imageRect.left) / imageRect.width) * imageWidth
    const yInImage = ((intersectTop - imageRect.top) / imageRect.height) * imageHeight
    const wInImage = (intersectWidth / imageRect.width) * imageWidth
    const hInImage = (intersectHeight / imageRect.height) * imageHeight

    // Draw the cropped image (center the crop if intersection is smaller than overlay)
    ctx.drawImage(
      imageRef.current,
      xInImage,
      yInImage,
      wInImage,
      hInImage,
      0,
      0,
      200,
      200
    )

    // Convert to data URL
    const focusedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onCrop(focusedImageDataUrl)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'w-[95vw] h-[85vh] max-w-none' : 'max-w-2xl'} max-h-[90vh] overflow-hidden flex flex-col`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Move className="h-5 w-5" />
            Center Profile Picture
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Instructions - hidden on mobile to save space */}
          {!isMobile && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg flex-shrink-0">
              <p className="font-medium mb-1">How to focus your image:</p>
              <ul className="space-y-1 text-xs">
                <li>• Drag the image to position the part you want under the focus circle</li>
                <li>• Use the zoom slider to adjust the image size</li>
                <li>• The area within the circle will be cropped to create your avatar</li>
              </ul>
            </div>
          )}

          {/* Image Preview Area - with mobile scroll optimization */}
          <div className={`flex-1 flex items-center justify-center ${isMobile ? 'overflow-hidden' : 'overflow-hidden'}`}>
            <div
              ref={containerRef}
              className="relative flex items-center justify-center mx-auto"
              style={{ 
                width: cropperSize.width, 
                height: cropperSize.height, 
                background: '#222', 
                borderRadius: 16, 
                overflow: 'hidden',
                maxWidth: '100%',
                maxHeight: '100%',
                // Prevent touch scrolling on the cropper area
                touchAction: 'none'
              }}
            >
              {/* Main Image (draggable, zoomable) */}
              {imageSrc && (
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Full image"
                  className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
                    transition: isDragging ? 'none' : 'transform 0.1s',
                    // Prevent image dragging from triggering scroll
                    touchAction: 'none'
                  }}
                  onLoad={handleImageLoad}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  draggable={false}
                />
              )}
              {/* Circular Focus Overlay */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2"
                style={{
                  width: Math.min(cropperSize.width, cropperSize.height) * 0.8,
                  height: Math.min(cropperSize.width, cropperSize.height) * 0.8,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                  border: '4px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <span className="text-white/70 text-xs font-medium select-none">Focus Area</span>
              </div>
            </div>
          </div>

          {/* Controls - always visible and positioned above mobile nav */}
          <div className={`space-y-4 flex-shrink-0 ${isMobile ? 'pb-4' : ''}`}>
            {/* Zoom Control - optimized for mobile */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  <span className={isMobile ? "text-base font-medium" : ""}>Zoom</span>
                </span>
                <span className={`text-muted-foreground ${isMobile ? "text-base font-medium" : ""}`}>
                  {Math.round(position.scale * 100)}%
                </span>
              </div>
              <div className={`${isMobile ? 'px-2' : ''}`}>
                <Slider
                  value={[position.scale]}
                  onValueChange={handleZoomChange}
                  min={Math.max(0.1, initialScale * 0.5)}
                  max={Math.max(3, initialScale * 2)}
                  step={0.1}
                  className={`w-full ${isMobile ? 'h-8' : ''}`}
                />
              </div>
            </div>

            {/* Mobile instructions */}
            {isMobile && (
              <div className="text-xs text-muted-foreground text-center bg-muted/30 p-2 rounded">
                <p>Drag to move • Use slider to zoom • Tap Apply when ready</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size={isMobile ? "default" : "sm"}
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size={isMobile ? "default" : "sm"}
                onClick={handleApply}
                disabled={!imageLoaded}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 