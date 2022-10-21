import * as I from './types'

export default class TileComponent {
  id: I.TileId
  size: number
  position: I.Position
  positionOnBoard: Readonly<I.Position>
  borderWidth: number
  strokeColor: string
  textAlign: CanvasTextAlign
  textBaseLine: CanvasTextBaseline

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

  draw(
    ctx: CanvasRenderingContext2D,
    options: {
      canvasSize: { width: number, height: number }
      tileMatrix: number
    }
  ) {
    ctx.beginPath()
    ctx.lineWidth = this.borderWidth
    ctx.strokeStyle = this.strokeColor

    //begin calculations
    const min = Math.min(options.canvasSize.width, options.canvasSize.height)
    this.size = min / options.tileMatrix

    ctx.font = `${this.size / 2}px Arial`
    ctx.textAlign = this.textAlign
    ctx.textBaseline = this.textBaseLine 

    const deltaX = options.canvasSize.width / 2 - (this.size * options.tileMatrix / 2)
    const deltaY = options.canvasSize.height / 2 - (this.size * options.tileMatrix / 2)

    const rectX = this.positionOnBoard.x * this.size + deltaX
    const rectY = this.positionOnBoard.y * this.size + deltaY
    this.position = { x: rectX, y: rectY } 

    ctx.rect(rectX, rectY, this.size, this.size)
    ctx.fillText(this.id, rectX + (this.size / 2), rectY + (this.size / 2))

    ctx.stroke() 
  }
}