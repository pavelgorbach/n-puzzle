import * as utils from './utils'
export default class Timer {
  containerEl: HTMLElement
  paused: boolean

  startTime: number
  spentTime: number

  constructor(containerEl: HTMLElement, spentTime: number = 0 ) {
    this.containerEl = containerEl
    this.spentTime = spentTime
    this.paused = true
    this.containerEl.innerText = utils.secondsToDHMS(this.spentTime)
  }

  pause() {
    this.paused = true
  }

  reset(){
    this.startTime = new Date().getTime()
    this.spentTime = 0
    this.containerEl.innerText = `00:00:00:00`
  }

  count() {
    const now = new Date().getTime()
    this.spentTime = now - this.startTime

    this.containerEl.innerText = utils.secondsToDHMS(this.spentTime)

    if (!this.paused) {
      requestAnimationFrame(() => this.count())
    }
  }
  
  start() {
    this.paused = false
    this.startTime = new Date().getTime() - this.spentTime
    this.count()
  }
}