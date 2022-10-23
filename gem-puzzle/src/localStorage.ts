import { LocalStorageState, PuzzleState } from "./types"
import * as structs from './structs'

export default abstract class GameProgressLocalStorage {
  static STORAGE_KEY = 'GAME_PROGRESS' 

  static readState = (storageKey = GameProgressLocalStorage.STORAGE_KEY): LocalStorageState | null => {
    const initialState = window.localStorage.getItem(this.STORAGE_KEY)

    if (initialState === null) return null

    try {
      const parsedState: unknown = JSON.parse(initialState)
      structs.LocalStorageState.assert(parsedState)

      return parsedState
    } catch (e) {
      console.warn('Could not parse GameProgressLocalStorage', e)
      this.clearState()
    }

    return null
  }

  static clearState() {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static writeState = (state: PuzzleState) => {
    const tiles: LocalStorageState['tiles'] = []

    state.tiles.forEach((tile) => {
      tiles.push(tile.toObject())
    })

    const localStorageState: LocalStorageState = {
      tileMatrix: state.tileMatrix,
      tiles: tiles,
      paused: state.paused,
      time: state.time,
      count: state.count,
      unoccupiedPosition: state.unoccupiedPosition,
      sound: state.sound,
      music: state.music
    }

    const encoded = JSON.stringify(localStorageState)

    window.localStorage.setItem(this.STORAGE_KEY, encoded)
  }
}