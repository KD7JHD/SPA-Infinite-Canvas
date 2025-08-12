import React, { useState } from 'react'
import { Group, Rect, Text, Circle } from 'react-konva'
import { useProject, NodeState } from '../state/ProjectContext'

export function BlockNode({ node, snapToGrid, gridSize }: {
  node: NodeState
  snapToGrid: boolean
  gridSize: number
}) {
  const { updateNode, removeNode, setConfiguringBlockId, getBlock, setSelectedNodeId, selectedNodeId } = useProject()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const blockConfig = getBlock(node.blockId)
  const blockColor = blockConfig?.color || '#111827'
  const isSelected = selectedNodeId === node.id

  return (
    <Group
      x={node.x}
      y={node.y}
      draggable
      onDragEnd={(e) => {
        let nx = e.target.x(), ny = e.target.y()
        if (snapToGrid) {
          nx = Math.round(nx / gridSize) * gridSize
          ny = Math.round(ny / gridSize) * gridSize
        }
        updateNode(node.id, { x: nx, y: ny })
      }}
    >
      <Rect
        width={360}
        height={320}
        cornerRadius={16}
        fill={blockColor}
        shadowBlur={8}
        stroke="#374151"
      />
      <Text text={node.config?.name || '🎵 Lyricist'} x={12} y={12} fontStyle="bold" fontSize={16} fill="#e5e7eb" />
      <Text text="Click to expand form inline" x={12} y={40} fontSize={12} fill="#cbd5e1" />

      {/* Main click area for opening form (exclude header area with buttons) */}
      <Rect
        x={0}
        y={40}
        width={360}
        height={280}
        fill={isSelected ? 'rgba(255,255,255,0.06)' : 'transparent'}
        onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
      />

      {/* Config button */}
      <Circle
        x={340}
        y={20}
        radius={12}
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth={1}
        onClick={(e) => {
          ;(e as any).cancelBubble = true
          setConfiguringBlockId(node.blockId)
        }}
      />
      <Text
        text="⚙"
        x={332}
        y={8}
        fontSize={14}
        onClick={(e) => {
          ;(e as any).cancelBubble = true
          setConfiguringBlockId(node.blockId)
        }}
      />

      {/* Delete button */}
      <Circle
        x={314}
        y={20}
        radius={12}
        fill="#fef2f2"
        stroke="#fecaca"
        strokeWidth={1}
        onClick={(e) => {
          ;(e as any).cancelBubble = true
          setConfirmingDelete((prev) => !prev)
        }}
      />
      <Text
        text="🗑"
        x={306}
        y={8}
        fontSize={14}
        onClick={(e) => {
          ;(e as any).cancelBubble = true
          setConfirmingDelete((prev) => !prev)
        }}
      />

      {confirmingDelete && (
        <Group
          x={250}
          y={32}
          onMouseDown={(e) => ((e as any).cancelBubble = true)}
          onClick={(e) => ((e as any).cancelBubble = true)}
        >
          <Rect width={100} height={64} cornerRadius={8} fill="#ffffff" stroke="#e5e7eb" shadowBlur={6} />
          <Text text="Delete?" x={10} y={8} fontSize={12} fill="#374151" />
          <Rect
            x={8}
            y={28}
            width={84}
            height={24}
            cornerRadius={6}
            fill="#fee2e2"
            stroke="#fecaca"
            onClick={(e) => {
              ;(e as any).cancelBubble = true
              removeNode(node.id)
            }}
          />
          <Text
            text="Confirm"
            x={30}
            y={32}
            fontSize={12}
            fill="#991b1b"
            onClick={(e) => {
              ;(e as any).cancelBubble = true
              removeNode(node.id)
            }}
          />
        </Group>
      )}

      {/* Config now opens in right sidebar via setConfiguringBlockId */}
    </Group>
  )
}

// No modal or inline React portal here; the form renders as an HTML card in Canvas
