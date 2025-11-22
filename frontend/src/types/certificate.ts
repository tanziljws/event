export interface TextElement {
  id: string
  type: 'text'
  placeholder: string
  position: { x: number; y: number }
  fontSize: number
  fontFamily: string
  fontWeight: string
  color: string
  textAlign: 'left' | 'center' | 'right'
  width?: number
  height?: number
}

export interface ImageElement {
  id: string
  type: 'image'
  src: string
  position: { x: number; y: number }
  width: number
  height: number
  opacity: number
  zIndex: number
}

export type CanvasElement = TextElement | ImageElement
