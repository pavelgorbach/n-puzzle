import * as I from './types'
import * as utils from './utils'

import soundOnIcon from './assets/icons/sound-on.svg'
import soundOffIcon from './assets/icons/sound-off.svg'
import musicOnIcon from './assets/icons/music-note.svg'
import musicOffIcon from './assets/icons/music-note-crossed-out.svg'

import GameProgressLocalStorage from './localStorage'
import TileComponent from './tile'
import TimerComponent from './timer'

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
  unoccupiedPosition: { x: 3, y: 3 },
  sound: true,
  music: true,
  completed: false
}
export default class Puzzle {
  private options: Options
  private state: I.PuzzleState

  private rootEl: HTMLElement
  private displayEl: HTMLElement
  private indicatorEl: HTMLElement
  private counterEl: HTMLElement
  private timerEl: HTMLElement
  private matrixButtonEl: HTMLButtonElement
  private canvasEl: HTMLCanvasElement
  private controlsEl: HTMLElement
  private resetButtonEl: HTMLButtonElement
  private startButtonEl: HTMLButtonElement
  private saveButtonEl: HTMLButtonElement
  private resultsButtonEl: HTMLButtonElement
  private soundButtonEl: HTMLButtonElement
  private musicButtonEl: HTMLButtonElement
  private soundIconEl: HTMLImageElement
  private musicIconEl: HTMLImageElement

  private ctx: CanvasRenderingContext2D
  private canvasDims: I.CanvasDims

  private backgroundFx: HTMLAudioElement 
  private resetBoardFx: HTMLAudioElement
  private tileTickFx: HTMLAudioElement
  private buttonPressFx: HTMLAudioElement
  private cheeringFx: HTMLAudioElement

  private showResults: boolean

  constructor(rootEl: HTMLElement, initialState = INITIAL_STATE, options: Options = DEFAULT_OPTIONS) {
    this.options = options
    this.rootEl = rootEl

    this.displayEl = document.createElement('div')
    this.displayEl.classList.add('display')

    this.indicatorEl = document.createElement('div')
    this.indicatorEl.classList.add('indicator', 'paused')

    this.counterEl = document.createElement('div')
    this.counterEl.classList.add('counter')
    this.counterEl.innerText = `${initialState.count}`

    this.timerEl = document.createElement('div')
    this.timerEl.classList.add('timer')
    this.timerEl.innerText = `${initialState.time}`

    this.musicButtonEl = document.createElement('button')
    this.musicButtonEl.classList.add('button', 'music')
    this.musicIconEl = document.createElement('img') 
    this.musicIconEl.src = initialState.music ? musicOnIcon : musicOffIcon
    this.musicButtonEl.append(this.musicIconEl)

    this.soundButtonEl = document.createElement('button')
    this.soundButtonEl.classList.add('button', 'sound')
    this.soundIconEl = document.createElement('img') 
    this.soundIconEl.src = initialState.sound ? soundOnIcon : soundOffIcon
    this.soundButtonEl.append(this.soundIconEl)

    this.controlsEl = document.createElement('div')
    this.controlsEl.classList.add('controls')

    this.matrixButtonEl = document.createElement('button')
    this.matrixButtonEl.classList.add('button', 'matrix')
    this.matrixButtonEl.innerText = `${initialState.tileMatrix}x${initialState.tileMatrix}`

    this.resetButtonEl = document.createElement('button')
    this.resetButtonEl.classList.add('button', 'reset')
    this.resetButtonEl.innerText = 'Reset'

    this.startButtonEl = document.createElement('button')
    this.startButtonEl.classList.add('button', 'play')
    this.startButtonEl.innerText = initialState.paused ? 'Start' : 'Pause'
    
    this.saveButtonEl = document.createElement('button')
    this.saveButtonEl.classList.add('button')
    this.saveButtonEl.innerText = 'Save'

    this.resultsButtonEl = document.createElement('button')
    this.resultsButtonEl.classList.add('button')
    this.resultsButtonEl.innerText = 'Results'

    this.resetBoardFx = new Audio(require('./assets/fx/shuffle.mp3').default) 
    this.tileTickFx = new Audio(require('./assets/fx/hit.wav').default) 
    this.backgroundFx = new Audio(require('./assets/fx/serenity.mp3').default)
    this.backgroundFx.loop = true 
    this.buttonPressFx = new Audio(require('./assets/fx/button-press.mp3').default) 
    this.cheeringFx = new Audio(require('./assets/fx/firework.mp3').default) 

    this.displayEl.append(
      this.matrixButtonEl,
      this.resetButtonEl,
      this.counterEl,
      this.timerEl,
      this.soundButtonEl,
      this.musicButtonEl,
    )

    this.controlsEl.append(
      this.indicatorEl,
      this.startButtonEl,
      this.saveButtonEl,
      this.resultsButtonEl
    )

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

    const time = new TimerComponent(this.timerEl, initialState.time)

    this.state = { ...initialState, tiles, time }

    this.canvasEl.style.cursor = 'pointer'
    this.canvasEl.oncontextmenu = () => false

    this.mount()
  }

  private reset() {
    this.pause()
    if(this.state.sound) this.resetBoardFx.play()
    if(this.state.music) this.backgroundFx.currentTime = 0
    if(this.state.completed) {
      this.state.completed = false
      this.indicatorEl.classList.remove('completed')
      this.startButtonEl.disabled = false
      this.saveButtonEl.disabled = false
    }
    if(this.showResults) this.showResults = false

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
    this.state.time.reset()
    this.state.unoccupiedPosition = {
      x: this.state.tileMatrix - 1,
      y: this.state.tileMatrix - 1
    }
    this.counterEl.innerText = `${this.state.count}`

    this.render()
  }

  private async start() {
    this.state.paused = false
    this.startButtonEl.innerText = 'Pause'
    this.indicatorEl.classList.remove('paused')
    if(this.showResults) this.showResults = false

    if(this.state.music) {
      this.backgroundFx.play()
    }

    this.state.time.start()
    this.render()
  }

  private pause() {
    this.state.paused = true
    this.startButtonEl.innerText = 'Start'
    this.indicatorEl.classList.add('paused')

    this.state.time.pause()

    if(this.state.music) {
      this.backgroundFx.pause()
    }
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

  private toggleSound() {
    if(this.state.sound) {
      this.soundIconEl.src = soundOffIcon 
    } else {
      this.soundIconEl.src = soundOnIcon
    } 
    this.state.sound = !this.state.sound
  }

  private toggleMusic() {
    if(this.state.music) {
      this.musicIconEl.src = musicOffIcon 
    } else {
      this.musicIconEl.src = musicOnIcon 
    } 
    this.state.music = !this.state.music

    if(!this.state.music) {
      this.backgroundFx.pause()
      this.backgroundFx.currentTime = 0
    }

    if(this.state.music && !this.state.paused) {
      this.backgroundFx.currentTime = 0
      this.backgroundFx.play()
    }
  }

  private buttonPress() {
    if(this.state.sound) {
      this.buttonPressFx.currentTime = 0
      this.buttonPressFx.play()
    }
  }

  private complete() {
    this.cheeringFx.play()
    this.state.completed = true

    let results: I.TopResult[] = [{ moves: this.state.count, spentTime: this.state.time.spentTime }]
    const resultsLocalStorage = window.localStorage.getItem('RESULTS')

    if(resultsLocalStorage) {
      const previousResults = JSON.parse(resultsLocalStorage)
      results = [...results, ...previousResults]
      results.sort((a, b) => a.spentTime - b.spentTime)
      results = results.slice(0, 10)
    }

    window.localStorage.setItem('RESULTS', JSON.stringify(results))

    this.state.paused = true
    this.state.time.pause()
    this.indicatorEl.classList.add('completed')
    this.startButtonEl.innerText = 'Completed'
    this.startButtonEl.disabled = true
    this.saveButtonEl.disabled = true
  }

  private isCompleted() {
    let idx = 0

    loop:
    for(let i = 0; i < this.state.tileMatrix; i++) {
      for(let j = 0; j < this.state.tileMatrix; j++) {
        const tile = this.state.tiles.get(`${idx}` as I.TileId)
        if(tile && tile.id === `${idx}` && tile.positionOnBoard.x === j && tile.positionOnBoard.y === i) {
          idx++
        } else {
          break loop
        }
      }
    }

    return idx === this.state.tiles.size
  }

  private addEventListeners() {
    new ResizeObserver(() => this.render()).observe(this.canvasEl)

    this.canvasEl.addEventListener('mousedown', async (e) => {
      if(this.state.completed) return

      if(this.state.paused) {
        this.start()
        return
      }

      if(this.showResults) this.showResults = false

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

        if(this.state.sound) {
          this.tileTickFx.currentTime = 0
          this.tileTickFx.play()
        }

        if(this.isCompleted()) {
          this.complete()
        }

        this.render()
      }
    })

    this.resetButtonEl.addEventListener('click', () => {
      this.buttonPress()
      this.reset()
    })

    this.startButtonEl.addEventListener('click', () => {
      this.buttonPress()
      if(this.state.paused) {
        this.start()
      } else {
        this.pause()
      }
    })

    this.saveButtonEl.addEventListener('click', () => {
      if(this.state.completed) {
        return
      }
      this.buttonPress()
      this.save()
    })

    this.matrixButtonEl.addEventListener('click', () => {
      this.buttonPress()
      this.changeTileMatrix()
    })

    this.soundButtonEl.addEventListener('click', () => {
      this.buttonPress()
      this.toggleSound()
    })

    this.musicButtonEl.addEventListener('click', () => {
      this.buttonPress()
      this.toggleMusic()
    })

    this.resultsButtonEl.addEventListener('click', () => {
      this.showResults = !this.showResults 
      this.render()
    })

    window.addEventListener('beforeunload', (e) => {
      //TODO: show Warning message
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

      this.state.tiles.forEach((tile) => {
        const tileSize = boardDims.size / this.state.tileMatrix

        tile.updateDimensions({
          x: boardDims.x + tile.positionOnBoard.x * tileSize,
          y: boardDims.y + tile.positionOnBoard.y * tileSize,
          size: boardDims.size / this.state.tileMatrix
        })

        tile.draw(this.ctx)
      })

      if(this.state.completed) {
        this.ctx.font = `${boardDims.size / 30}px Arial`
        const spentTime = this.state.time.spentTime
        const congrats = `Hooray! You solved the puzzle in ${utils.secondsToDHMS(spentTime)} and ${this.state.count} moves!`
        const width = this.ctx.measureText(congrats).width + boardDims.size / 20
        const height = boardDims.size / 10
        const x = boardDims.x + (boardDims.size / 2)
        const y = boardDims.y + (boardDims.size / 2)
        this.ctx.fillStyle = 'white'
        this.ctx.fillRect(x - (width / 2), y - (height / 2), width, height)
        this.ctx.fillStyle = 'black'
        this.ctx.fillText(congrats, x, y)
      }

      if(this.showResults) {
        const localStorageResults = window.localStorage.getItem('RESULTS')
        if(!localStorageResults) return

        const results: I.TopResult[] = JSON.parse(localStorageResults)
        this.ctx.font = `${boardDims.size / 30}px Arial`

        results.forEach((item, idx) => {
          const itemText = `${idx + 1}. time: ${utils.secondsToDHMS(item.spentTime)}, moves: ${item.moves}` 
          const width = this.ctx.measureText(itemText).width + boardDims.size / 20
          const height = boardDims.size / 10
          const x = boardDims.x + (boardDims.size / 2)
          const y = boardDims.y + (boardDims.size / results.length) + (idx * (height / 1.1))
          this.ctx.fillStyle = 'white'
          this.ctx.fillRect(x - (width / 2), y - (height / 2), width, height)
          this.ctx.fillStyle = 'black'
          this.ctx.fillText(itemText, x, y)
        })
      }
    })
  }
}