import { useMemo, useState } from 'react'
import { Arrow, Group, Layer, Rect, Stage, Text } from 'react-konva'
import type { Connection, Note } from '../../types/domain'

interface BoardCanvasProps {
  notes: Note[]
  connections: Connection[]
  onNoteDragEnd: (noteId: string, x: number, y: number) => void
}

const getCenter = (note: Note) => ({
  x: note.posX + note.width / 2,
  y: note.posY + note.height / 2,
})

export function BoardCanvas({ notes, connections, onNoteDragEnd }: BoardCanvasProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const notesById = useMemo(() => new Map(notes.map((note) => [note.id, note])), [notes])

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight - 64}
      draggable
      x={position.x}
      y={position.y}
      scaleX={scale}
      scaleY={scale}
      onDragEnd={(event) => {
        if (event.target !== event.currentTarget) return
        setPosition({ x: event.currentTarget.x(), y: event.currentTarget.y() })
      }}
      onWheel={(event) => {
        event.evt.preventDefault()
        const direction = event.evt.deltaY > 0 ? -1 : 1
        const nextScale = direction > 0 ? scale * 1.05 : scale / 1.05
        setScale(Math.max(0.4, Math.min(nextScale, 2.4)))
      }}
      className="bg-slate-900"
    >
      <Layer>
        {connections.map((connection) => {
          const from = notesById.get(connection.noteIdFrom)
          const to = notesById.get(connection.noteIdTo)

          if (!from || !to) return null

          const fromCenter = getCenter(from)
          const toCenter = getCenter(to)

          return (
            <Arrow
              key={connection.id}
              points={[fromCenter.x, fromCenter.y, toCenter.x, toCenter.y]}
              stroke="#cbd5e1"
              fill="#cbd5e1"
              strokeWidth={2}
              pointerLength={8}
              pointerWidth={8}
            />
          )
        })}
      </Layer>

      <Layer>
        {notes.map((note) => (
          <Group
            key={note.id}
            x={note.posX}
            y={note.posY}
            draggable
            onDragEnd={(event) => {
              event.cancelBubble = true
              onNoteDragEnd(note.id, event.target.x(), event.target.y())
            }}
          >
            <Rect
              width={note.width}
              height={note.height}
              fill={note.color}
              cornerRadius={8}
              shadowColor="#020617"
              shadowOpacity={0.35}
              shadowBlur={8}
            />
            <Text x={12} y={10} text={note.title || 'Untitled'} fontSize={16} fill="#0f172a" fontStyle="bold" />
            <Text
              x={12}
              y={36}
              width={note.width - 24}
              height={note.height - 48}
              text={note.content}
              fontSize={14}
              fill="#1e293b"
              lineHeight={1.35}
            />
          </Group>
        ))}
      </Layer>
    </Stage>
  )
}