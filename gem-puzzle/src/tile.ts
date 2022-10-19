import * as I from './types'

export default class TileComponent {
  id: I.TileId
  position: Readonly<I.Position>
  size: number

  constructor(tile: I.TileDTO) {
    this.id = tile.id
    this.position = tile.position
    this.size = tile.size
  }

  toObject = (): I.TileDTO => {
    return {
      id: this.id,
      position: this.position,
      size: this.size
    }
  }

  render() {
    
  }
}