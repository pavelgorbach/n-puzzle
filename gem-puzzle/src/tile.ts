import * as I from './types'

export default class TileComponent {
  id: I.TileId
  positionOnBoard: Readonly<I.Position>
  borderWidth: number
  strokeColor: string
  textAlign: CanvasTextAlign
  textBaseLine: CanvasTextBaseline

  position: I.Position
  size: number

  constructor(
    tile: I.TileDTO,
    options: { borderWidth: number, strokeColor: string, textAlign: CanvasTextAlign, textBaseLine: CanvasTextBaseline }
  ) {
    this.id = tile.id
    this.positionOnBoard = tile.positionOnBoard
    this.borderWidth = options.borderWidth
    this.strokeColor = options.strokeColor
    this.textAlign = options.textAlign
    this.textBaseLine = options.textBaseLine
  }

  toObject = (): I.TileDTO => {
    return {
      id: this.id,
      positionOnBoard: this.positionOnBoard
    }
  }

  updateDimensions(p : { x: number; y: number; size: number}) {
    this.position = { x: p.x, y: p.y} 
    this.size = p.size
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.lineWidth = this.borderWidth
    ctx.strokeStyle = this.strokeColor
    ctx.textAlign = this.textAlign
    ctx.textBaseline = this.textBaseLine 
    ctx.font = `${this.size / 2}px Arial`
    ctx.rect(this.position.x, this.position.y, this.size, this.size)
    ctx.fillText(`${Number(this.id) + 1}`, this.position.x + (this.size / 2), this.position.y + (this.size / 2))
    ctx.stroke() 
  }
}