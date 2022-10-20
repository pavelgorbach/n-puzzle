import * as I from './types'

import { canvasDimensions, generateTiles } from './utils'

import GameProgressLocalStorage from './localStorage'
import TileComponent from './tile'

type Options = Readonly<{
  canvasStyleWidth: string 
  canvasStyleHeight: string 
  tileBorderWidth: number
  defaultTileStrokeColor: string
}>

export const DEFAULT_OPTIONS: Options = {
  canvasStyleWidth: '100%',
  canvasStyleHeight: '100%',
  tileBorderWidth: 1,
  defaultTileStrokeColor: 'black'
}
export default class Puzzle {
  private options: Options
  private state: I.PuzzleState

  private rootEl: HTMLElement
  private canvasEl: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private canvasDims: I.CanvasDims
  
  private onTileDrag: null | ((e: MouseEvent) => void) = null

  constructor(
    rootEl: HTMLElement,
    initialState: I.LocalStorageState = { moves: 0, time: 0, paused: true, tiles: [], tileMatrix: 4 },
    options: Options = DEFAULT_OPTIONS,
  ) {
    this.options = options

    this.canvasEl = document.createElement('canvas')
    this.canvasEl.style.position = 'relative'
    this.canvasEl.style.width = options.canvasStyleWidth
    this.canvasEl.style.height = options.canvasStyleHeight

    rootEl.append(this.canvasEl)

    this.canvasDims = canvasDimensions(this.canvasEl)
    this.canvasEl.width = this.canvasDims.pxWidth
    this.canvasEl.height = this.canvasDims.pxHeight

    const canvasContext = this.canvasEl.getContext('2d')
    if(canvasContext === null) throw new Error('Cannot create canvas element')

    this.ctx = canvasContext
    this.ctx.scale(this.canvasDims.dpr, this.canvasDims.dpr)

    const tiles: Map<I.TileId, TileComponent> = new Map()

    if(initialState.tiles.length > 0) {
      initialState.tiles.forEach((tile) => {
        tiles.set(tile.id, new TileComponent(tile))
      })
    } else { 
      const initialTiles = generateTiles(initialState.tileMatrix)
      initialTiles.forEach((tile) => {
        tiles.set(tile.id, new TileComponent(tile))
      })
    }

    this.state = { ...initialState, tiles }

    this.mount()
  }

  save() {
    GameProgressLocalStorage.writeState(this.state)
  }

  private addEventListeners() {
    new ResizeObserver(() => this.render()).observe(this.canvasEl)
  }

  private mount() {
    this.canvasEl.oncontextmenu = () => false

    this.render()
    this.addEventListeners()
  }

  private clear() {
    this.canvasDims = canvasDimensions(this.canvasEl)
    this.canvasEl.width = this.canvasDims.pxWidth
    this.canvasEl.height = this.canvasDims.pxHeight

    this.ctx.scale(this.canvasDims.dpr, this.canvasDims.dpr)
    this.ctx.clearRect(0, 0, this.canvasDims.cssWidth, this.canvasDims.cssHeight)
  }

  private render() {
    requestAnimationFrame(() => {
      this.clear()  

      this.state.tiles.forEach((tile) => {
        tile.draw(
          this.ctx,
          {
            tileBorderWidth: this.options.tileBorderWidth,
            initialStrokeColor: this.options.defaultTileStrokeColor,
            canvasSize: { width: this.canvasDims.cssWidth, height: this.canvasDims.cssHeight },
            tileMatrix: this.state.tileMatrix
          }
        )
      })
    })
  }
}