import TileComponent from './tile'

type Brand<K, T> = K & { __brand: T }

export type TileId = Brand<string, 'Tile'>

export type Position = {
  x: number
  y: number
}

export type TileDTO = {
  id: TileId
  position: Position
  size: number
}

export type PuzzleState = {
  tileMatrix: 3 | 4 | 5 | 6 | 7 | 8
  moves: number
  time: number
  paused: boolean
  tiles: Map<TileId, TileComponent>
}

export type LocalStorageState = {
  tileMatrix: 3 | 4 | 5 | 6 | 7 | 8
  moves: number
  time: number
  paused: boolean
  tiles: TileDTO[]
}