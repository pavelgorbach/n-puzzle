import * as I from './types'
import { Struct, string, object, number, array, boolean, union, literal } from 'superstruct'

const tileId = (): Struct<I.TileId, null> => string() as any

export const Tile: Struct<I.TileDTO> = object({
  id: tileId(),
  size: number(),
  positionOnBoard: object({
    x: number(),
    y: number(),
  })
})

export const LocalStorageState: Struct<I.LocalStorageState> = object({
  tileMatrix: union([ literal(3), literal(4), literal(5), literal(6), literal(7), literal(8) ]),
  moves: number(),
  time: number(),
  paused: boolean(),
  tiles: array(Tile),
  unoccupiedPosition: object({ x: number(), y: number() })
})