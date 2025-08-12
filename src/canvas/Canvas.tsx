import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Stage, Layer, Group, Circle } from 'react-konva'
import { useProject } from '../state/ProjectContext'
import { BlockNode } from '../blocks/BlockNode'
import { InlineNodeFormCard } from '../forms/InlineNodeFormCard'

export function Canvas() {
  const { currentProject, addNode, selectedNodeId, setSelectedNodeId, updateNode } = useProject()
  const stageRef = useRef<any>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize] = useState(50)

  // Debug logging
  useEffect(() => {
    console.log('Canvas received currentProject:', currentProject)
    console.log('Number of nodes:', currentProject.nodes.length)
  }, [currentProject])

  // Default to fit view on mount and when switching projects
  useEffect(() => {
    // Delay to ensure Stage is measured
    const id = window.setTimeout(() => {
      zoomToFit()
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      zoomToFit()
    }, 0)
    return () => window.clearTimeout(id)
  }, [currentProject.id])

  const onWheel = (e: any) => {
    e.evt.preventDefault()
    const scaleBy = 1.05
    const oldScale = scale
    const pointer = stageRef.current.getPointerPosition()
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    }
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    
    // Limit zoom between 0.1 and 3
    const clampedScale = Math.max(0.1, Math.min(3, newScale))
    setScale(clampedScale)
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    }
    setPosition(newPos)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const stage = stageRef.current
    const pointer = stage.getPointerPosition()
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      console.log('Dropped data:', data, 'at position:', pointer)
      
      // Convert pointer position to stage coordinates
      const stagePos = stage.getPointerPosition()
      const dropX = (stagePos.x - position.x) / scale
      const dropY = (stagePos.y - position.y) / scale
      
      // Snap to grid if enabled
      const snappedX = snapToGrid ? Math.round(dropX / gridSize) * gridSize : dropX
      const snappedY = snapToGrid ? Math.round(dropY / gridSize) * gridSize : dropY
      
      addNode({
        ...data,
        x: snappedX,
        y: snappedY
      })
    } catch (error) {
      console.error('Error parsing dropped data:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const zoomToFit = () => {
    if (currentProject.nodes.length === 0) {
      // If no nodes, reset to default view
      setScale(1)
      setPosition({ x: 0, y: 0 })
      return
    }

    // Calculate bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    currentProject.nodes.forEach(node => {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + 360) // node width
      maxY = Math.max(maxY, node.y + 320) // node height
    })

    // Add padding
    const padding = 100
    minX -= padding
    minY -= padding
    maxX += padding
    maxY += padding

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const stageWidth = window.innerWidth - 580 // Account for sidebars
    const stageHeight = window.innerHeight - 48

    // Calculate scale to fit content
    const scaleX = stageWidth / contentWidth
    const scaleY = stageHeight / contentHeight
    const newScale = Math.min(scaleX, scaleY, 1) // Don't zoom in beyond 1x

    setScale(newScale)
    
    // Center the content
    const centerX = (stageWidth - contentWidth * newScale) / 2
    const centerY = (stageHeight - contentHeight * newScale) / 2
    setPosition({
      x: centerX - minX * newScale,
      y: centerY - minY * newScale
    })
  }

  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Generate infinite dot grid
  const generateDotGrid = (): Array<{x: number, y: number}> => {
    const dots: Array<{x: number, y: number}> = []
    const stageWidth = window.innerWidth - 580
    const stageHeight = window.innerHeight - 48
    
    // Calculate visible area in world coordinates
    const visibleLeft = -position.x / scale
    const visibleTop = -position.y / scale
    const visibleRight = visibleLeft + stageWidth / scale
    const visibleBottom = visibleTop + stageHeight / scale
    
    // Generate dots in visible area with some margin
    const margin = 200
    const startX = Math.floor((visibleLeft - margin) / gridSize) * gridSize
    const endX = Math.ceil((visibleRight + margin) / gridSize) * gridSize
    const startY = Math.floor((visibleTop - margin) / gridSize) * gridSize
    const endY = Math.ceil((visibleBottom + margin) / gridSize) * gridSize
    
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        dots.push({ x, y })
      }
    }
    
    return dots
  }

  const selectedNode = useMemo(
    () => currentProject.nodes.find((n) => n.id === selectedNodeId) || null,
    [currentProject.nodes, selectedNodeId]
  )

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Canvas Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform z-10 flex gap-2">
        <button
          onClick={zoomToFit}
          className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
          title="Zoom to fit all nodes"
        >
          🔍 Fit
        </button>
        <button
          onClick={resetView}
          className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
          title="Reset view"
        >
          🏠 Reset
        </button>
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`px-3 py-1 border rounded shadow-sm text-sm ${
            snapToGrid 
              ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' 
              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
          title="Toggle snap to grid"
        >
          📐 Grid
        </button>
      </div>

      <Stage 
        ref={stageRef} 
        width={window.innerWidth - 580} 
        height={window.innerHeight - 48} 
        onWheel={onWheel} 
        draggable
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        onDragEnd={(e) => {
          setPosition({ x: e.target.x(), y: e.target.y() })
        }}
      >
        <Layer>
          {/* Infinite dot grid */}
          <Group>
            {generateDotGrid().map((dot, index) => (
              <Circle
                key={`dot-${index}`}
                x={dot.x}
                y={dot.y}
                radius={1}
                fill="#e5e7eb"
              />
            ))}
          </Group>
          
          {/* Empty state visuals removed from canvas; canvas only handles layout */}
          
          {/* Render blocks as self-contained objects */}
          {currentProject.nodes.map((n) => (
            <BlockNode key={n.id} node={n as any} snapToGrid={snapToGrid} gridSize={gridSize} />
          ))}
        </Layer>
      </Stage>

      {/* Inline HTML form anchored to the selected node, rendered above the canvas */}
      {selectedNode && (
        <InlineNodeFormCard
          node={selectedNode}
          screenX={position.x + selectedNode.x * scale}
          screenY={position.y + (selectedNode.y + 320) * scale}
          scale={scale}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={(patch) => updateNode(selectedNode.id, patch)}
        />
      )}
    </div>
  )
}

