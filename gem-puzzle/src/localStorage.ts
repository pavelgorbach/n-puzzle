import { LocalStorageState, PuzzleState } from "./types"
import * as structs from './structs'

export default abstract class GameProgressLocalStorage {
  static STORAGE_KEY: 'GAME_PROGRESS' 

  static readState = (): LocalStorageState | null => {
    const initialState = localStorage.getItem(this.STORAGE_KEY)

    if (initialState === null) return null

    try {
      const parsedState: unknown = JSON.parse(initialState)

      structs.LocalStorageState.assert(parsedState)
      return parsedState
    } catch (e) {
      console.warn('Could not parse GameProgressLocalStorage')
      localStorage.removeItem(this.STORAGE_KEY)
    }

    return null
  }

  static writeState = (state: PuzzleState) => {
    const localStorageState: LocalStorageState = {
      frameSize: state.frameSize,
      moves: state.moves,
      time: state.time,
      paused: state.paused,
      tiles: state.tiles,
    }

    const encoded = JSON.stringify(localStorageState)
    
    window.localStorage.setItem(this.STORAGE_KEY, encoded)
  }
}