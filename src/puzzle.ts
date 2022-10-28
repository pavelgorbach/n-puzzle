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
  minTileMatrix: number
  maxTileMatrix: number
}>

export const DEFAULT_OPTIONS: Options = {
  tileBorderWidth: 1,
  defaultTileStrokeColor: 'black',
  tileTextAlign: "center",
  tileTextBaseLine: "middle",
  minTileMatrix: 3,
  maxTileMatrix: 8
}

const INITIAL_STATE: I.LocalStorageState = {
  count: 0,
  time: 0,
  paused: true,
  tiles: [],
  tileMatrix: 4, 
  sound: true,
  music: true
}
export default class Puzzle {
  private options: Options
  private state: I.PuzzleState

  private showResultsPopup: boolean
  private isPuzzleCompleted: boolean 

  private rootEl: HTMLElement
  private popupEl: HTMLDivElement

  // app header (display + controls)
  private displayEl: HTMLElement
  private matrixButtonEl: HTMLButtonElement
  private resetButtonEl: HTMLButtonElement
  private counterEl: HTMLElement
  private timerEl: HTMLElement

  // puzzle 
  private canvasEl: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private canvasDims: I.CanvasDims

  // app footer (controls)
  private controlsEl: HTMLElement
  private indicatorEl: HTMLElement
  private startButtonEl: HTMLButtonElement
  private saveButtonEl: HTMLButtonElement
  private resultsButtonEl: HTMLButtonElement
  private soundButtonEl: HTMLButtonElement
  private musicButtonEl: HTMLButtonElement
  private soundIconEl: HTMLImageElement
  private musicIconEl: HTMLImageElement

  // sound FX
  private tileTickFx: HTMLAudioElement
  private buttonPressFx: HTMLAudioElement
  private resetBoardFx: HTMLAudioElement
  private cheeringFx: HTMLAudioElement
  private backgroundFx: HTMLAudioElement 

  constructor(rootEl: HTMLElement, initialState = INITIAL_STATE, options: Options = DEFAULT_OPTIONS) {
    this.options = options
    this.rootEl = rootEl

    this.popupEl = document.createElement('div')
    this.popupEl.classList.add('popup-overlay')
    const popupInner = document.createElement('div')
    popupInner.classList.add('popup')
    this.popupEl.append(popupInner)

    // app header (display + controls)
    this.displayEl = document.createElement('div')
    this.displayEl.classList.add('display')
    this.matrixButtonEl = document.createElement('button')
    this.matrixButtonEl.classList.add('button', 'matrix')
    this.matrixButtonEl.innerText = `${initialState.tileMatrix}x${initialState.tileMatrix}`
    this.resetButtonEl = document.createElement('button')
    this.resetButtonEl.classList.add('button', 'reset')
    this.resetButtonEl.innerText = 'Reset'
    this.counterEl = document.createElement('div')
    this.counterEl.classList.add('counter')
    this.counterEl.innerText = `${initialState.count}`
    this.timerEl = document.createElement('div')
    this.timerEl.classList.add('timer')
    this.timerEl.innerText = `${initialState.time}`
    this.soundButtonEl = document.createElement('button')
    this.soundButtonEl.classList.add('button', 'sound')
    this.soundIconEl = document.createElement('img') 
    this.soundIconEl.src = initialState.sound ? soundOnIcon : soundOffIcon
    this.soundButtonEl.append(this.soundIconEl)
    this.musicButtonEl = document.createElement('button')
    this.musicButtonEl.classList.add('button', 'music')
    this.musicIconEl = document.createElement('img') 
    this.musicIconEl.src = initialState.music ? musicOnIcon : musicOffIcon
    this.musicButtonEl.append(this.musicIconEl)
    this.displayEl.append(
      this.matrixButtonEl,
      this.resetButtonEl,
      this.counterEl,
      this.timerEl,
      this.soundButtonEl,
      this.musicButtonEl,
    )

    // app footer (controls)
    this.controlsEl = document.createElement('div')
    this.controlsEl.classList.add('controls')
    this.indicatorEl = document.createElement('div')
    this.indicatorEl.classList.add('indicator', 'paused')
    this.startButtonEl = document.createElement('button')
    this.startButtonEl.classList.add('button', 'play')
    this.startButtonEl.innerText = initialState.paused ? 'Start' : 'Pause'
    this.saveButtonEl = document.createElement('button')
    this.saveButtonEl.classList.add('button')
    this.saveButtonEl.innerText = 'Save'
    this.resultsButtonEl = document.createElement('button')
    this.resultsButtonEl.classList.add('button')
    this.resultsButtonEl.innerText = 'Results'
    this.controlsEl.append(
      this.indicatorEl,
      this.startButtonEl,
      this.saveButtonEl,
      this.resultsButtonEl
    )

    // sound FX
    this.tileTickFx = new Audio(require('./assets/fx/hit.mp3').default) 
    this.buttonPressFx = new Audio(require('./assets/fx/button-press.mp3').default) 
    this.resetBoardFx = new Audio(require('./assets/fx/shuffle.mp3').default) 
    this.cheeringFx = new Audio(require('./assets/fx/firework.mp3').default) 
    this.backgroundFx = new Audio(require('./assets/fx/serenity.mp3').default)
    this.backgroundFx.loop = true 

    // puzzle
    this.canvasEl = document.createElement('canvas')
    this.canvasEl.classList.add('canvas')
    const canvasContext = this.canvasEl.getContext('2d')

    if(canvasContext === null) throw new Error('Cannot get canvas context')

    this.canvasEl.style.cursor = 'pointer'
    this.canvasEl.oncontextmenu = () => false
    this.ctx = canvasContext

    let initialTiles = initialState.tiles

    if(initialTiles.length === 0) {
      initialTiles = utils.generateTiles(initialState.tileMatrix)
    }

    const tiles = this.createTilesComponents(initialTiles) 
    const time = new TimerComponent(this.timerEl, initialState.time)
    
    this.state = { ...initialState, tiles, time }

    this.mount()
  }

  private createTilesComponents(tilesDTO: I.TileDTO[]) {
    const tiles: Map<I.TileId, TileComponent> = new Map()

    tilesDTO.forEach((tile) => {
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

    return tiles
  } 

  private async start() {
    this.state.paused = false
    this.state.time.start()

    this.startButtonEl.innerText = 'Pause'
    this.indicatorEl.classList.remove('paused')

    if(this.showResultsPopup) this.showResultsPopup = false
    if(this.state.music) this.backgroundFx.play()

    this.render()
  }

  private pause() {
    this.state.paused = true
    this.state.time.pause()

    this.startButtonEl.innerText = 'Start'
    this.indicatorEl.classList.add('paused')

    if(this.state.music) this.backgroundFx.pause()
  }

  private save() {
    GameProgressLocalStorage.writeState(this.state)
  }

  private reset() {
    if(this.state.sound) this.resetBoardFx.play()

    this.state.count = 0
    this.state.time.reset()

    const generatedTiles = utils.generateTiles(this.state.tileMatrix)
    const tiles = this.createTilesComponents(generatedTiles)
    this.state.tiles = tiles

    this.counterEl.innerText = `${this.state.count}`
    this.showResultsPopup = false
    this.isPuzzleCompleted = false
    this.indicatorEl.classList.remove('completed')
    if(this.state.paused) {
      this.backgroundFx.currentTime = 0
      this.backgroundFx.pause()
      this.startButtonEl.innerText = 'Start'
    }
    this.startButtonEl.disabled = false
    this.saveButtonEl.disabled = false

    this.render()
  }

  private changeTileMatrix() {
    const matrix = this.state.tileMatrix + 1

    if(matrix > this.options.maxTileMatrix) {
      this.state.tileMatrix = this.options.minTileMatrix
      this.matrixButtonEl.innerText = '3x3' 
    } else {
      this.state.tileMatrix = matrix
      this.matrixButtonEl.innerText = `${matrix}x${matrix}`
    }

    this.reset()
  } 

  private complete() {
    this.state.time.pause()
    this.state.paused = true
    this.isPuzzleCompleted = true

    this.cheeringFx.play()
    this.indicatorEl.classList.add('completed')
    this.startButtonEl.innerText = 'Completed'
    this.startButtonEl.disabled = true
    this.saveButtonEl.disabled = true

    this.saveResults()
  }

  private saveResults() {
    // TODO: add structs
    const STORAGE_KEY = 'RESULTS'
    const resultsLocalStorage = window.localStorage.getItem(STORAGE_KEY)

    let results: I.TopResult[] = [{
      moves: this.state.count,
      spentTime: this.state.time.spentTime,
      matrix: this.state.tileMatrix 
    }]

    if(resultsLocalStorage) {
      const previousResults = JSON.parse(resultsLocalStorage)
      results = [...results, ...previousResults]
      results.sort((a, b) => a.spentTime - b.spentTime)
      results = results.slice(0, 10)
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  }

  private getUnoccupiedTile() {
    return this.state.tiles.get('0' as I.TileId)
  }

  private swipeTilePositionsOnBoard(a: TileComponent, b: TileComponent) {
    const newPositionOnBoard = { x: a.positionOnBoard.x, y: a.positionOnBoard.y }
    a.positionOnBoard = b.positionOnBoard
    b.positionOnBoard = newPositionOnBoard
  }

  private findTileByPosition = (p: { x: number, y: number }): TileComponent | null => {
    const tiles = [...this.state.tiles.values()]

    for (let i = tiles.length - 1; i >= 0; i--) {
      const tile = tiles[i]

      if(tile.id === '0') continue 

      const isClickWithinTileArea = utils.getIsPointWithinTileArea({
        point: { ...p },
        tile: { x: tile.position.x, y: tile.position.y, size: tile.size },
      })

      if (isClickWithinTileArea === false) continue

      return tile
    }

    return null
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

  private playButtonFX() {
    if(this.state.sound) {
      this.buttonPressFx.currentTime = 0
      this.buttonPressFx.play()
    }
  }

  private showHorayPopup() {
    const spentTime = this.state.time.spentTime
    const congrats = `Hooray! You solved the puzzle in ${utils.secondsToDHMS(spentTime)} and ${this.state.count} moves!`

    this.popupEl.classList.add('visible')
    const p = document.createElement('p')
    p.innerText = congrats 
    this.popupEl.firstElementChild.replaceChildren(p)
  }

  private showTopResultsPopup(){
    // TODO: add structs
    const localStorageResults = window.localStorage.getItem('RESULTS')
    if(!localStorageResults) return

    const results: I.TopResult[] = JSON.parse(localStorageResults)

    const table = document.createElement('table')
    const headerRow = document.createElement('tr')
    headerRow.innerHTML = `<th>time</th> <th>moves</th> <th>size</th>`
    table.append(headerRow)

    results.forEach((item, idx) => {
      const time = `${utils.secondsToDHMS(item.spentTime)}` 
      const moves = `${item.moves}` 
      const matrix = `${item.matrix}x${item.matrix}` 
      const row = document.createElement('tr')
      row.innerHTML =`<td>${time}</td> <td>${moves}</td> <td>${matrix}</td>` 
      table.append(row)
    })

    this.popupEl.classList.add('visible')
    const inner = this.popupEl.firstElementChild.replaceChildren(table)
  }

  private addEventListeners() {
    new ResizeObserver(() => this.render()).observe(this.canvasEl)

    this.popupEl.addEventListener('click', () => {
      this.isPuzzleCompleted = false
      this.showResultsPopup = false
      this.popupEl.classList.remove('visible')
    })

    this.canvasEl.addEventListener('mousedown', async (e) => {
      if(this.state.paused) return

      if(this.isPuzzleCompleted) this.isPuzzleCompleted = false 
      if(this.showResultsPopup) this.showResultsPopup = false

      const cursorPosition = { x: e.offsetX, y: e.offsetY }
      const tileMatch = this.findTileByPosition(cursorPosition)

      if(tileMatch === null) return

      const unoccupiedTile = this.getUnoccupiedTile()
      const tileMovable = utils.isTileNextToUnoccupied(tileMatch.positionOnBoard, unoccupiedTile.positionOnBoard)

      if(tileMovable) {
        this.swipeTilePositionsOnBoard(unoccupiedTile, tileMatch)

        //TODO: refactor
        // if(newPositionOnBoard.x > tileMatch.positionOnBoard.x) {
        //   for(let i = 0; i < 10; i++) {
        //     setTimeout(() => {
        //       tileMatch.positionOnBoard = {
        //         x: +(tileMatch.positionOnBoard.x + .1).toFixed(1),
        //         y: tileMatch.positionOnBoard.y
        //       }
        //       this.render()
        //     }, i * 10)
        //   }
        // }

        this.state.count++
        this.counterEl.innerText = `${this.state.count}`

        if(this.state.sound) {
          this.tileTickFx.pause()
          this.tileTickFx.currentTime = 0
          this.tileTickFx.play()
        }
        
        if(utils.isCompleted({ tileMatrix: this.state.tileMatrix, tiles: this.state.tiles })) {
          this.complete()
        }
      }

      this.render()
    })

    this.resetButtonEl.addEventListener('click', () => {
      this.playButtonFX()
      this.reset()
    })

    this.startButtonEl.addEventListener('click', () => {
      this.playButtonFX()
      if(this.state.paused) {
        this.start()
      } else {
        this.pause()
      }
    })

    this.saveButtonEl.addEventListener('click', () => {
      if(this.isPuzzleCompleted) return
      this.playButtonFX()
      this.save()
    })

    this.matrixButtonEl.addEventListener('click', () => {
      this.playButtonFX()
      this.changeTileMatrix()
    })

    this.soundButtonEl.addEventListener('click', () => {
      this.playButtonFX()
      this.toggleSound()
    })

    this.musicButtonEl.addEventListener('click', () => {
      this.playButtonFX()
      this.toggleMusic()
    })

    this.resultsButtonEl.addEventListener('click', () => {
      this.showResultsPopup = !this.showResultsPopup
      if(this.isPuzzleCompleted) this.isPuzzleCompleted = false
      this.playButtonFX()
      this.render()
    })
  } 

  private mount() {
    this.rootEl.append(this.displayEl, this.canvasEl, this.controlsEl, this.popupEl)

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
        if(tile.id === '0') return

        const tileSize = boardDims.size / this.state.tileMatrix

        tile.updateDimensions({
          x: boardDims.x + tile.positionOnBoard.x * tileSize,
          y: boardDims.y + tile.positionOnBoard.y * tileSize,
          size: boardDims.size / this.state.tileMatrix
        })

        tile.draw(this.ctx)
      })

      if(this.isPuzzleCompleted) {
        this.showHorayPopup()
      }

      if(this.showResultsPopup) {
        this.showTopResultsPopup()
      }
    })
  }
}