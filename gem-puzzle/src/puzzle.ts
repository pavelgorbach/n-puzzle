import * as I from './types'
import * as utils from './utils'

import GameProgressLocalStorage from './localStorage'
import TileComponent from './tile'

type Options = Readonly<{
  tileBorderWidth: number
  defaultTileStrokeColor: string
  tileTextAlign: CanvasTextAlign 
  tileTextBaseLine: CanvasTextBaseline 
}>

export const DEFAULT_OPTIONS: Options = {
  tileBorderWidth: 1,
  defaultTileStrokeColor: 'black',
  tileTextAlign: "center",
  tileTextBaseLine: "middle" 
}

const INITIAL_STATE: I.LocalStorageState = {
  moves: 0,
  time: 0,
  paused: true,
  tiles: [],
  tileMatrix: 4, 
  unoccupiedPosition: { x: 3, y: 3 }
}
export default class Puzzle {
  private state: I.PuzzleState

  private rootEl: HTMLElement
  private displayEl: HTMLElement
  private canvasEl: HTMLCanvasElement
  private controlsEl: HTMLElement

  private ctx: CanvasRenderingContext2D
  private canvasDims: I.CanvasDims

  constructor(rootEl: HTMLElement, initialState = INITIAL_STATE, options: Options = DEFAULT_OPTIONS) {
    this.rootEl = rootEl

    const display = document.createElement('div')
    display.classList.add('display')

    const counter = document.createElement('div')
    counter.classList.add('counter')
    counter.innerText = '5'

    const timer = document.createElement('div')
    timer.classList.add('timer')
    timer.innerText = '10:55'

    display.append(counter, timer)
    this.displayEl = display

    const controls = document.createElement('div')
    controls.classList.add('controls')

    const resetButton = document.createElement('button')
    resetButton.classList.add('button')
    resetButton.innerText = 'Reset'

    const playButton = document.createElement('button')
    playButton.classList.add('button')
    playButton.innerText = 'Play'
    
    const saveButton = document.createElement('button')
    saveButton.classList.add('button')
    saveButton.innerText = 'Save'

    const resultsButton = document.createElement('button')
    resultsButton.classList.add('button')
    resultsButton.innerText = 'Results'

    controls.append(resetButton, playButton, saveButton, resultsButton)
    this.controlsEl = controls 

    this.canvasEl = document.createElement('canvas')
    this.canvasEl.classList.add('canvas')

    const canvasContext = this.canvasEl.getContext('2d')

    if(canvasContext === null) throw new Error('Cannot get canvas context')

    this.ctx = canvasContext

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
    this.rootEl.append(this.displayEl, this.canvasEl, this.controlsEl)

    this.canvasDims = utils.getCanvasDimensions(this.canvasEl)
    this.canvasEl.width = this.canvasDims.pxWidth
    this.canvasEl.height = this.canvasDims.pxHeight
    this.ctx.scale(this.canvasDims.dpr, this.canvasDims.dpr)

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
     
      const boardDims = utils.getBoardDimensions({
        canvasSize: { width: this.canvasDims.cssWidth, height: this.canvasDims.cssHeight },
        tileMatrix: this.state.tileMatrix,
      })

      this.ctx.beginPath()
      this.ctx.fillStyle = 'gray'
      this.ctx.fillRect(boardDims.x, boardDims.y, boardDims.size, boardDims.size)
      this.ctx.closePath()

      this.state.tiles.forEach((tile) => {
        const tileSize = boardDims.size / this.state.tileMatrix

        tile.updateDimensions({
          x: boardDims.x + tile.positionOnBoard.x * tileSize,
          y: boardDims.y + tile.positionOnBoard.y * tileSize,
          size: boardDims.size / this.state.tileMatrix
        })

        tile.draw(this.ctx)
      })
    })
  }
}