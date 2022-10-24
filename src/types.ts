import TileComponent from './tile'
import Timer from './timer'

type Brand<K, T> = K & { __brand: T }

export type TileId = Brand<string, 'Tile'>

export type Position = {
  x: number
  y: number
}

export type TileDTO = {
  id: TileId
  positionOnBoard: Position
}

export type TileMatrix = 3 | 4 | 5 | 6 | 7 | 8

export type CanvasDims = {
  cssWidth: number
  cssHeight: number
  pxWidth: number
  pxHeight: number
  dpr: number
}

export type PuzzleState = {
  tileMatrix: TileMatrix 
  count: number
  time: Timer 
  paused: boolean
  tiles: Map<TileId, TileComponent>
  unoccupiedPosition: Position
  sound: boolean
  music: boolean
  completed: boolean
}

export type LocalStorageState = {
  tileMatrix: TileMatrix 
  count: number
  time: number 
  paused: boolean
  tiles: TileDTO[]
  unoccupiedPosition: Position
  sound: boolean
  music: boolean
  completed: boolean
}

export type TopResult = {
  moves: number
  spentTime: number
}