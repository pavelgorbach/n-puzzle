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
      positionOnBoard: {
        x: this.positionOnBoard.x,
        y: this.positionOnBoard.y
      }
    }
  }

  updateDimensions(p : { x: number; y: number; size: number}) {
    this.position = { x: p.x, y: p.y} 
    this.size = p.size
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.lineWidth = this.borderWidth
    ctx.textAlign = this.textAlign
    ctx.textBaseline = this.textBaseLine 
    ctx.font = `${this.size / 2}px Arial`

    ctx.fillStyle = 'white'
    ctx.fillRect(this.position.x, this.position.y, this.size, this.size)

    ctx.fillStyle = 'black'
    ctx.fillText(this.id, this.position.x + (this.size / 2), this.position.y + (this.size / 2))

    ctx.strokeStyle = this.strokeColor
    ctx.strokeRect(this.position.x, this.position.y, this.size, this.size)
    ctx.closePath()
  }
}