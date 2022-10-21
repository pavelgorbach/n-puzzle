import * as I from './types'
import * as utils from './utils'

import GameProgressLocalStorage from './localStorage'
import TileComponent from './tile'

type Options = Readonly<{
  canvasStylePosition: string
  canvasStyleWidth: string 
  canvasStyleHeight: string 
  tileBorderWidth: number
  defaultTileStrokeColor: string
  tileTextAlign: CanvasTextAlign 
  tileTextBaseLine: CanvasTextBaseline 
}>

export const DEFAULT_OPTIONS: Options = {
  canvasStylePosition: 'relative',
  canvasStyleWidth: '100%',
  canvasStyleHeight: '100%',
  tileBorderWidth: 1,
  defaultTileStrokeColor: 'black',
  tileTextAlign: "center",
  tileTextBaseLine: "middle" 
}
export default class Puzzle {
  private state: I.PuzzleState

  private canvasEl: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private canvasDims: I.CanvasDims

  constructor(
    rootEl: HTMLElement,
    initialState: I.LocalStorageState = {
      moves: 0,
      time: 0,
      paused: true,
      tiles: [],
      tileMatrix: 4, 
      unoccupiedPosition: { x: 3, y: 3 }
    },
    options: Options = DEFAULT_OPTIONS,
  ) {
    this.canvasEl = document.createElement('canvas')
    this.canvasEl.style.position = options.canvasStylePosition 
    this.canvasEl.style.width = options.canvasStyleWidth
    this.canvasEl.style.height = options.canvasStyleHeight

    rootEl.append(this.canvasEl)

    this.canvasDims = utils.getCanvasDimensions(this.canvasEl)
    this.canvasEl.width = this.canvasDims.pxWidth
    this.canvasEl.height = this.canvasDims.pxHeight

    const canvasContext = this.canvasEl.getContext('2d')

    if(canvasContext === null) throw new Error('Cannot get canvas context')

    this.ctx = canvasContext
    this.ctx.scale(this.canvasDims.dpr, this.canvasDims.dpr)

    const tiles: Map<I.TileId, TileComponent> = new Map()

    let initialTiles = initialState.tiles

    if(initialTiles.length === 0) {
      const generatedTiles = utils.generateTiles(initialState.tileMatrix)
      initialTiles = utils.shuffleTiles(generatedTiles)
    }

    initialTiles.forEach((tile) => {
      tiles.set(
        tile.id,
        new TileComponent(tile, {
          borderWidth: options.tileBorderWidth,
          strokeColor: options.defaultTileStrokeColor,
          textAlign: options.tileTextAlign,
          textBaseLine: options.tileTextBaseLine
        })
      )
    })

    this.state = { ...initialState, tiles }

    this.mount()
  }

  stopAndShuffle() {
    const arr = [...this.state.tiles.values()]
    const shuffledTiels = utils.shuffleTiles(arr)

    shuffledTiels.forEach((tile) => {
      this.state.tiles.set(tile.id, tile)
    })

    this.render()
  }

  save() {
    GameProgressLocalStorage.writeState(this.state)
  }

  private addEventListeners() {
    new ResizeObserver(() => this.render()).observe(this.canvasEl)

    this.canvasEl.addEventListener('mousedown', (e) => {
      const cursorPosition = { x: e.offsetX, y: e.offsetY }
      const tileMatch = this.findTileByPosition(cursorPosition)

      if(tileMatch === null) return

      const tileMovable = utils.isTileNextToUnoccupied(tileMatch.positionOnBoard, this.state.unoccupiedPosition)

      if(tileMovable) {
        const newPositionOnBoard = this.state.unoccupiedPosition
        this.state.unoccupiedPosition = tileMatch.positionOnBoard  
        tileMatch.positionOnBoard = newPositionOnBoard
        
        this.render()
      }
    })
  }

  private findTileByPosition = (p: { x: number, y: number }): TileComponent | null => {
    const tiles = [...this.state.tiles.values()]

    for (let i = tiles.length - 1; i >= 0; i--) {
      const tile = tiles[i]

      const isClickWithinTileArea = utils.getIsPointWithinTileArea({
        point: { ...p },
        tile: { x: tile.position.x, y: tile.position.y, size: tile.size },
      })

      if (isClickWithinTileArea === false) continue

      return tile
    }

    return null
  }

  private mount() {
    this.canvasEl.oncontextmenu = () => false

    this.render()
    this.addEventListeners()
  }

  private clear() {
    this.canvasDims = utils.getCanvasDimensions(this.canvasEl)

    this.canvasEl.width = this.canvasDims.pxWidth
    this.canvasEl.height = this.canvasDims.pxHeight

    this.ctx.scale(this.canvasDims.dpr, this.canvasDims.dpr)
    this.ctx.clearRect(0, 0, this.canvasDims.cssWidth, this.canvasDims.cssHeight)
  }

  private render() {
    requestAnimationFrame(() => {
      this.clear()  
      
      this.state.tiles.forEach((tile) => {
        const tileDims = utils.getTileDimensions({
          canvasSize: { width: this.canvasDims.cssWidth, height: this.canvasDims.cssHeight },
          tileMatrix: this.state.tileMatrix,
          tilePositionOnBoard: tile.positionOnBoard
        })

        tile.updateDimensions(tileDims)

        tile.draw(this.ctx)
      })
    })
  }
}