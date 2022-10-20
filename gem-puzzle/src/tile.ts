import * as I from './types'

export default class TileComponent {
  id: I.TileId
  position: Readonly<I.Position>
  size: number

  constructor(tile: I.TileDTO) {
    this.id = tile.id
    this.position = tile.position
  }

  toObject = (): I.TileDTO => {
    return {
      id: this.id,
      position: this.position
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    options: {
      tileBorderWidth: number,
      initialStrokeColor: string
      canvasSize: { width: number, height: number }
      tileMatrix: number
    }
  ) {
    ctx.beginPath()

    ctx.lineWidth = options.tileBorderWidth
    ctx.strokeStyle = options.initialStrokeColor

    const min = Math.min(options.canvasSize.width, options.canvasSize.height)
    const size = min / options.tileMatrix
    const delta = options.canvasSize.width / 2 - (size * options.tileMatrix / 2)

    ctx.rect(
      this.position.x * size + delta, 
      this.position.y * size + options.canvasSize.height / 2 - (size * options.tileMatrix / 2), 
      size,
      size 
    )

    ctx.stroke() 
  }
}