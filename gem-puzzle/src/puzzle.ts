import * as I from './types'
import TileComponent from './tile'

type Options = {
  canvasSize: { width: number, height: number }
  canvasOutlineStyle: string
}

const DEFAULT_OPTIONS: Options = {
  canvasSize: { width: 640, height: 640 },
  canvasOutlineStyle: '1px solid gray'
}

export default class Puzzle {
  private state: I.PuzzleState

  private rootEl: HTMLElement
  private canvasEl: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private options: Options
  
  private onTileDrag: null | ((e: MouseEvent) => void) = null

  constructor(
    rootEl: HTMLElement,
    initialState: I.LocalStorageState = { moves: 0, time: 0, paused: true, tiles: [], tileMatrix: 4 },
    options: Options = DEFAULT_OPTIONS
  ) {
    this.options = options

    const tiles: Map<I.TileId, TileComponent> = new Map()

    initialState.tiles.forEach((tile) => {
      tiles.set(
        tile.id,
        new TileComponent(tile)
      )
    })

    this.state = { ...initialState, tiles }

    this.rootEl = rootEl
    this.canvasEl = document.createElement('canvas')

    const canvasContext = this.canvasEl.getContext('2d')
    if(canvasContext === null) throw new Error('Cannot create canvas element')

    this.ctx = canvasContext

    this.mount()
  }

  start() {

  }

  stop() {

  }

  save() {

  }

  showResults() {

  }

  onGameFinished() {

  }
  
  private addEventListeners() {

  }

  private mount() {
    this.canvasEl.setAttribute('width', this.options.canvasSize.width.toString())
    this.canvasEl.setAttribute('height', this.options.canvasSize.height.toString())
    this.canvasEl.style.outline = this.options.canvasOutlineStyle

    this.canvasEl.oncontextmenu = () => false

    this.rootEl.append(this.canvasEl)

    this.render()
    this.addEventListeners()
  }

  private clear() {
    this.ctx.clearRect(0, 0, this.options.canvasSize.width, this.options.canvasSize.height)
  }

  private render() {
    requestAnimationFrame(() => {
      this.clear()
      console.log('REQUEST ANIMATION FRAME')
    })
  }
}