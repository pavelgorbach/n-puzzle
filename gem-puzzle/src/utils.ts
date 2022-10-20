import * as I from './types'

/** Return the CSS dimensions, dpr (device pixel resolution), and desired pixel dimensions, of a canvas. */
export function canvasDimensions(canvas: HTMLCanvasElement | HTMLElement) {
  let dpr = window.devicePixelRatio           // DPR: How many device pixels per CSS pixel (can be fractional)
  let cssWidth = canvas.clientWidth           // CSS dimensions of canvas
  let cssHeight = canvas.clientHeight
  let pxWidth = Math.round(dpr * cssWidth)    // Dimensions we should set the backing buffer to.
  let pxHeight = Math.round(dpr * cssHeight)
  return { dpr, cssWidth, cssHeight, pxWidth, pxHeight }
}

export function generateTiles(matrix: number): I.TileDTO[] {
  const length = Math.pow(matrix, 2) - 1
  const ids = Array.from({ length }, (_, idx) => idx.toString())
  
  const tiles: I.TileDTO[] = []

  let idx = 0

  for(let i = 0; i < matrix; i++) {
    for(let j = 0; j < matrix; j++) {
      if(ids[idx]) {
        tiles.push({
          id: ids[idx] as I.TileId,
          position: { x: j, y: i },
        })
      }
      idx += 1
    }
  }

  return tiles
}