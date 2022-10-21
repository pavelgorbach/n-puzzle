import * as I from './types'

/** Return the CSS dimensions, dpr (device pixel resolution), and desired pixel dimensions, of a canvas. */
export function getCanvasDimensions(canvas: HTMLCanvasElement | HTMLElement) {
  let dpr = window.devicePixelRatio           // DPR: How many device pixels per CSS pixel (can be fractional)
  let cssWidth = canvas.clientWidth           // CSS dimensions of canvas
  let cssHeight = canvas.clientHeight
  let pxWidth = Math.round(dpr * cssWidth)    // Dimensions we should set the backing buffer to.
  let pxHeight = Math.round(dpr * cssHeight)
  return { dpr, cssWidth, cssHeight, pxWidth, pxHeight }
}

export function getIsPointWithinTileArea(p: {
  point: { x: number; y: number }
  tile: { x: number; y: number; size: number }
}): boolean {
  const x = p.point.x > p.tile.x && p.point.x < p.tile.x + p.tile.size
  const y = p.point.y > p.tile.y && p.point.y < p.tile.y + p.tile.size

  return x && y
}

export function ifTileNextToUnoccupied(tile: I.Position, unoccupied: I.Position) {
  return (
    tile.x === unoccupied.x && tile.y + 1 === unoccupied.y ||
    tile.x === unoccupied.x && tile.y - 1 === unoccupied.y ||
    tile.x + 1 === unoccupied.x && tile.y === unoccupied.y ||
    tile.x - 1 === unoccupied.x && tile.y === unoccupied.y
  )
}

export function generateTiles(matrix: number): I.TileDTO[] {
  const length = Math.pow(matrix, 2) - 1
  const ids = Array.from({ length }, (_, idx) => idx.toString())
  const shuffledIds = shuffle(ids) 
  
  const tiles: I.TileDTO[] = []

  let idx = 0

  for(let i = 0; i < matrix; i++) {
    for(let j = 0; j < matrix; j++) {
      if(shuffledIds[idx]) {
        tiles.push({
          id: shuffledIds[idx] as I.TileId,
          positionOnBoard: { x: j, y: i },
        })
      }
      idx += 1
    }
  }

  return tiles
}

export function shuffle(data: unknown[]) {
  const arr = [...data]
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr
}