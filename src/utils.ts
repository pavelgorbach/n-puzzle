import TileComponent from 'tile'
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

export function getBoardDimensions(p: {
  canvasSize: { width: number, height: number },
  tileMatrix: I.TileMatrix
}) {
  const min = Math.min(p.canvasSize.width, p.canvasSize.height)
  const tileSize = min / p.tileMatrix - ((min / p.tileMatrix / 4)) 
  const boardSize = tileSize * p.tileMatrix
  const x = (p.canvasSize.width - boardSize) / 2
  const y = (p.canvasSize.height - boardSize) / 2
  return { x, y, size: boardSize}
}

export function getIsPointWithinTileArea(p: {
  point: { x: number; y: number }
  tile: { x: number; y: number; size: number }
}): boolean {
  const x = p.point.x > p.tile.x && p.point.x < p.tile.x + p.tile.size
  const y = p.point.y > p.tile.y && p.point.y < p.tile.y + p.tile.size

  return x && y
}

export function isTileNextToUnoccupied(tile: I.Position, unoccupied: I.Position) {
  return (
    tile.x === unoccupied.x && tile.y + 1 === unoccupied.y ||
    tile.x === unoccupied.x && tile.y - 1 === unoccupied.y ||
    tile.x + 1 === unoccupied.x && tile.y === unoccupied.y ||
    tile.x - 1 === unoccupied.x && tile.y === unoccupied.y
  )
}

function to2dArray(data: number[], matrix: number) {
  let result: number[][] = Array.from({ length: matrix }, () => []) 

  let idx = 0
  for(let i = 0; i < matrix; i++) {
    for(let j = 0; j < matrix; j++) {
      result[i][j] = data[idx]
      idx++
    }
  }

  return result
}

export function generateTiles(matrix: number): I.TileDTO[] {
  const length = Math.pow(matrix, 2)
  const ids = Array.from({ length }, (_, idx) => idx)
  const shuffledIds = shuffle(ids)
  const tileMatrix = to2dArray(shuffledIds, matrix)

  if(!isPuzzleSolvable(tileMatrix)) {
    console.log('NOT SOLVABLE, regenerate is in progress..')
    return generateTiles(matrix)
  }
 
  const tiles: I.TileDTO[] = []
  tileMatrix.forEach((row, y) => {
    row.forEach((id, x) => {
      tiles.push({
        id: id.toString() as I.TileId,
        positionOnBoard: { x, y },
      })
    })
  })

  console.log('SOLVABLE')
  return tiles
}

export function shuffle<T>(data: T[]) {
  const arr = [...data]

  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr
}

const pad = (value: number) =>  ('0' + Math.floor(value)).slice(-2)
export function secondsToDHMS(sec: number) {
  const seconds = pad((sec / 1000) % 60)
  const minutes = pad((sec / (60 * 1000)) % 60)
  const hours = pad((sec / (60 * 60 * 1000)) % 24)
  const days = pad(sec / (24 * 60 * 60 * 1000))
  return `${days}:${hours}:${minutes}:${seconds}`
}

function isPuzzleSolvable(puzzle: number[][]) {
  let invCount = getInvCount(puzzle)
  return (invCount % 2 == 0)
}

function getInvCount(arr: number[][]) {
  let inv_count = 0

  for(let i = 0; i < arr.length - 1; i++) {
    for(let j = i + 1; j < arr.length; j++) {
      if (arr[j][i] > 0 && arr[j][i] > arr[i][j]) {
        inv_count += 1
      }
    }
  }

  return inv_count
}