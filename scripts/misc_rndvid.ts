import { $idA, $ready } from './util'

const canvas = $idA<HTMLCanvasElement>('rndvid')
let context: CanvasRenderingContext2D | null
let imagedata: ImageData | undefined

function resizeCanvas (): void {
  if (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) {
    // fullscreen mode
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  } else {
    const parent = canvas.parentNode! as HTMLElement
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight
  }

  context = canvas.getContext('2d')
  if (!context) return
  imagedata = context.createImageData(canvas.width, canvas.height)
}

$ready(function () {
  function makeImage () {
    if (!imagedata) return
    for (let i = (canvas.width * canvas.height << 2) - 1; i; --i) {
      imagedata.data[i] = !(~i & 3) ? 255 : Math.floor(Math.random() * 255)
    }
  }

  // Render loop
  // let lastRender = Date.now()
  function render () {
    window.requestAnimationFrame(render)

    if (!context || !imagedata) return

    // const now = Date.now()
    // if (now < lastRender + 100) return

    makeImage()
    context.putImageData(imagedata, 0, 0)
  // lastRender = now - ((now - lastRender) % 100)
  }

  canvas.addEventListener('click', () => {
    canvas.requestFullscreen().then(() => {
      resizeCanvas()
    }).catch(() => {
      alert('fullscreen failed')
    })
  })

  resizeCanvas()
  render()
})

window.onresize = resizeCanvas
