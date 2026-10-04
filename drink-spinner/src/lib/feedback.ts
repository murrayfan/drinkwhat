/** 轉盤音效（Web Audio，不需要音檔）與震動 */
let ctx: AudioContext | null = null

/** 需在使用者點擊時呼叫，瀏覽器才允許播放聲音 */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

function beep(freq: number, start: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, ctx.currentTime + start)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration)
}

export function playTick() {
  beep(1400, 0, 0.04, 0.08, 'triangle')
}

export function playWin() {
  beep(784, 0, 0.18, 0.18)
  beep(1047, 0.12, 0.18, 0.18)
  beep(1319, 0.24, 0.35, 0.18)
}

export function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}
