export function playCompletionSound(volume = 0.22): void {
  try {
    const ctx = new AudioContext()
    const notes = [
      { freq: 783.99, start: 0,    dur: 0.14 },
      { freq: 1046.5, start: 0.11, dur: 0.22 },
    ]
    notes.forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.018)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur + 0.05)
    })
    setTimeout(() => ctx.close(), 700)
  } catch {
    // AudioContext unavailable
  }
}
