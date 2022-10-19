import { PuzzleState, LocalStorageState } from './types'

type Options = {
  canvasSize: { width: number, height: number }
  frameSize: '3x3' | '4x4' | '5x5' | '6x6' | '7x7' | '8x8'
  canvasOutlineStyle: string
}

const DEFAULT_OPTIONS: Options = {
  canvasSize: { width: 640, height: 640 },
  frameSize: '4x4',
  canvasOutlineStyle: '1px solid gray'
}

export default class Puzzle {
  private state: PuzzleState

  private rootEl: HTMLElement
  private canvasEl: HTMLCanvasElement
  private options: Options
  
  private onSquareDrag: null | ((e: MouseEvent) => void) = null

  constructor(
    rootElement: HTMLElement,
    initialState: LocalStorageState = { moves: 0, time: 0, paused: true, tiles: [], frameSize: '4x4' }
  ) {

    this.state = initialState

    const canvasElement: HTMLCanvasElement = document.createElement('canvas')

    if(canvasElement === null) {
      throw new Error('Cannot create canvas element')
    }

    const ctx = canvasElement.getContext('2d')
    rootElement.appendChild(canvasElement)
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

  draw() {
    
  }
}