import 'normalize.css'

import GameProgressLocalStorage from './localStorage' 
import Puzzle from './puzzle'

import './style.css'

const rootElement = document.createElement('div')
rootElement.id = 'root'

document.body.append(rootElement)

const initialState = GameProgressLocalStorage.readState() || undefined

new Puzzle(rootElement, initialState)