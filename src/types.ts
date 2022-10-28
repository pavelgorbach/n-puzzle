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

export type CanvasDims = {
  cssWidth: number
  cssHeight: number
  pxWidth: number
  pxHeight: number
  dpr: number
}

export type PuzzleState = {
  tileMatrix: number 
  count: number
  time: Timer 
  paused: boolean
  tiles: Map<TileId, TileComponent>
  sound: boolean
  music: boolean
}

export type LocalStorageState = {
  tileMatrix: number 
  count: number
  time: number 
  paused: boolean
  tiles: TileDTO[]
  sound: boolean
  music: boolean
}

export type TopResult = {
  moves: number
  spentTime: number
  matrix: number
}