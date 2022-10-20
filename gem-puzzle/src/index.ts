import 'normalize.css'

import GameProgressLocalStorage from './localStorage' 
import Puzzle from './puzzle'

import './style.css'

const rootElement = document.getElementById('root')

if(rootElement === null) {
  throw new Error('cannot find rootElement')
}

const initialState = GameProgressLocalStorage.readState() || undefined 

new Puzzle(rootElement, initialState)