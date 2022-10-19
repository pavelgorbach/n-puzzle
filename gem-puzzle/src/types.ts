type Brand<K, T> = K & { __brand: T }

export type TileId = Brand<string, 'Tile'>

type Position = {
  x: number
  y: number
}

export type TileDTO = {
  id: TileId
  value: number
  position: Position
  size: number
}

export type PuzzleState = {
  frameSize: '3x3' | '4x4' | '5x5' | '6x6' | '7x7' | '8x8'
  moves: number
  time: number
  paused: boolean
  tiles: TileDTO[]
}

export type LocalStorageState = {
  frameSize: '3x3' | '4x4' | '5x5' | '6x6' | '7x7' | '8x8'
  moves: number
  time: number
  paused: boolean
  tiles: TileDTO[]
}