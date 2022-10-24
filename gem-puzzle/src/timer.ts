export default class Timer {
  containerEl: HTMLElement
  paused: boolean

  startTime: number
  spentTime: number

  constructor(containerEl: HTMLElement, spentTime: number = 0 ) {
    this.containerEl = containerEl
    this.spentTime = spentTime
    this.paused = true

    const seconds = this.pad((this.spentTime / 1000) % 60)
    const minutes = this.pad((this.spentTime / (60 * 1000)) % 60)
    const hours = this.pad((this.spentTime / (60 * 60 * 1000)) % 24)
    const days = this.pad(this.spentTime / (24 * 60 * 60 * 1000))

    this.containerEl.innerText = `${days}:${hours}:${minutes}:${seconds}`
  }

  pad(value: number) {
    return ('0' + Math.floor(value)).slice(-2)
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

    const seconds = this.pad((this.spentTime / 1000) % 60)
    const minutes = this.pad((this.spentTime / (60 * 1000)) % 60)
    const hours = this.pad((this.spentTime / (60 * 60 * 1000)) % 24)
    const days = this.pad(this.spentTime / (24 * 60 * 60 * 1000))

    this.containerEl.innerText = `${days}:${hours}:${minutes}:${seconds}`

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