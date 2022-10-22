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
  count: 0,
  time: 0,
  paused: true,
  tiles: [],
  tileMatrix: 4, 
  unoccupiedPosition: { x: 3, y: 3 }
}
export default class Puzzle {
  private options: Options
  private state: I.PuzzleState

  private rootEl: HTMLElement
  private displayEl: HTMLElement
  private counterEl: HTMLElement
  private matrixButtonEl: HTMLButtonElement
  private canvasEl: HTMLCanvasElement
  private controlsEl: HTMLElement
  private resetButtonEl: HTMLButtonElement
  private playButtonEl: HTMLButtonElement
  private saveButtonEl: HTMLButtonElement

  private ctx: CanvasRenderingContext2D
  private canvasDims: I.CanvasDims

  constructor(rootEl: HTMLElement, initialState = INITIAL_STATE, options: Options = DEFAULT_OPTIONS) {
    this.options = options
    this.rootEl = rootEl

    const display = document.createElement('div')
    display.classList.add('display')

    const counter = document.createElement('div')
    counter.classList.add('counter')
    counter.innerText = `${initialState.count}`
    this.counterEl = counter

    const timer = document.createElement('div')
    timer.classList.add('timer')
    timer.innerText = `${initialState.time}`

    display.append(counter, timer)
    this.displayEl = display

    const controls = document.createElement('div')
    controls.classList.add('controls')

    const matrixButton = document.createElement('button')
    matrixButton.classList.add('button', 'matrix')
    matrixButton.innerText = `${initialState.tileMatrix}x${initialState.tileMatrix}`
    this.matrixButtonEl = matrixButton 

    const resetButton = document.createElement('button')
    resetButton.classList.add('button')
    resetButton.innerText = 'Reset'
    this.resetButtonEl = resetButton 

    const playButton = document.createElement('button')
    playButton.classList.add('button', 'play')
    playButton.innerText = initialState.paused ? 'Play' : 'Pause'
    this.playButtonEl = playButton
    
    const saveButton = document.createElement('button')
    saveButton.classList.add('button')
    saveButton.innerText = 'Save'
    this.saveButtonEl = saveButton

    const resultsButton = document.createElement('button')
    resultsButton.classList.add('button')
    resultsButton.innerText = 'Results'

    controls.append(matrixButton, resetButton, playButton, saveButton, resultsButton)
    this.controlsEl = controls 

    this.canvasEl = document.createElement('canvas')
    this.canvasEl.classList.add('canvas')

    const canvasContext = this.canvasEl.getContext('2d')

    if(canvasContext === null) throw new Error('Cannot get canvas context')

    this.ctx = canvasContext

    const tiles: Map<I.TileId, TileComponent> = new Map()

    let initialTiles = initialState.tiles

    if(initialTiles.length === 0) {
      initialTiles = utils.generateTiles(initialState.tileMatrix)
    }

    initialTiles.forEach((tile, idx) => {
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

    this.canvasEl.style.cursor = 'pointer'
    this.canvasEl.oncontextmenu = () => false

    this.mount()
  }

  private reset() {
    GameProgressLocalStorage.clearState()
    const tiles: Map<I.TileId, TileComponent> = new Map()
    const generatedTiles = utils.generateTiles(this.state.tileMatrix)

    generatedTiles.forEach((tile) => {
      tiles.set(
        tile.id, 
        new TileComponent(tile, {
          borderWidth: this.options.tileBorderWidth,
          strokeColor: this.options.defaultTileStrokeColor,
          textAlign: this.options.tileTextAlign,
          textBaseLine: this.options.tileTextBaseLine
        })
      )
    })

    this.state.tiles = tiles
    this.state.count = 0
    this.state.time = 0
    this.state.unoccupiedPosition = {
      x: this.state.tileMatrix - 1,
      y: this.state.tileMatrix - 1
    }
    this.counterEl.innerText = `${this.state.count}`

    this.render()
  }

  private play() {
    this.state.paused = false
    this.playButtonEl.innerText = 'Pause'
  }

  private pause() {
    this.state.paused = true
    this.playButtonEl.innerText = 'Play'
  }

  private save() {
    GameProgressLocalStorage.writeState(this.state)
  }

  private changeTileMatrix() {
    const matrix = this.state.tileMatrix + 1 as I.TileMatrix

    if(matrix > 8) {
      this.state.tileMatrix = 3
      this.matrixButtonEl.innerText = '3x3' 
    } else {
      this.state.tileMatrix = matrix
      this.matrixButtonEl.innerText = `${matrix}x${matrix}`
    }
    this.reset()
  }

  private addEventListeners() {
    new ResizeObserver(() => this.render()).observe(this.canvasEl)

    this.canvasEl.addEventListener('mousedown', (e) => {
      if(this.state.paused) {
        return
      }

      const cursorPosition = { x: e.offsetX, y: e.offsetY }
      const tileMatch = this.findTileByPosition(cursorPosition)

      if(tileMatch === null) return

      const tileMovable = utils.isTileNextToUnoccupied(tileMatch.positionOnBoard, this.state.unoccupiedPosition)

      if(tileMovable) {
        const newPositionOnBoard = this.state.unoccupiedPosition
        this.state.unoccupiedPosition = tileMatch.positionOnBoard  
        tileMatch.positionOnBoard = newPositionOnBoard
       
        this.state.count++
        this.counterEl.innerText = `${this.state.count}`

        this.render()
      }
    })

    this.resetButtonEl.addEventListener('click', () => {
      this.reset()
    })

    this.playButtonEl.addEventListener('click', () => {
      if(this.state.paused) {
        this.play()
      } else {
        this.pause()
      }
    })

    this.saveButtonEl.addEventListener('click', () => {
      this.save()
    })

    this.matrixButtonEl.addEventListener('click', () => {
      this.changeTileMatrix()
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
      this.ctx.fillStyle = '#928C86'
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