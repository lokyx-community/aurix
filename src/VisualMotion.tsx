import { useEffect, useRef } from 'react'

/** Subtle champagne-gold particle ribbon shared by page headers and the home hero. */
export function ParticleRibbon() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0
    let raf = 0
    let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const draw = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)
      const t = reduced ? .55 : frame * .006
      for (let strand = 0; strand < 21; strand++) {
        ctx.beginPath()
        for (let i = 0; i <= 100; i++) {
          const u = i / 100
          const x = w * (.02 + u * .96)
          const wave = Math.sin(u * 7.1 + t + strand * .2) * h * .12
          const curl = Math.sin(u * 3.3 - t * .7) * h * .13
          const y = h * (.52 + (u - .5) * .12) + wave + curl + (strand - 10) * 2.2
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(${strand % 4 === 0 ? '255,232,173' : strand % 3 === 0 ? '223,174,66' : '180,130,38'},${.1 + (strand % 7) * .018})`
        ctx.lineWidth = strand % 6 === 0 ? 2.6 : strand % 2 === 0 ? 1.4 : .8
        ctx.stroke()
      }
      const count = Math.max(70, Math.min(220, Math.floor(w / 3)))
      for (let i = 0; i < count; i++) {
        const u = ((i / count) + t * .018) % 1
        const x = w * (.03 + u * .94)
        const y = h * (.5 + Math.sin(u * 7.1 + t) * .12 + Math.sin(u * 3.3 - t * .7) * .13)
        ctx.beginPath(); ctx.arc(x, y, .4 + (i % 4) * .23, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(224,177,70,${.12 + (Math.sin(i * 2.31 + t) + 1) * .13})`; ctx.fill()
      }
      frame++
      if (!reduced) raf = requestAnimationFrame(draw)
    }
    resize(); draw()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const onMotion = (event: MediaQueryListEvent) => { reduced = event.matches; if (!reduced) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw) } else cancelAnimationFrame(raf) }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    media.addEventListener?.('change', onMotion)
    return () => { cancelAnimationFrame(raf); observer.disconnect(); media.removeEventListener?.('change', onMotion) }
  }, [])
  return <canvas className="particle-ribbon" ref={canvasRef} aria-hidden="true" />
}
