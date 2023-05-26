import { $idA, $ready } from './util'

const $selectRenderer = $idA<HTMLDivElement>('selectRenderer')
const $selectRendererGroup = $idA<HTMLDivElement>('selectRendererGroup')

const $canvas = $idA<HTMLCanvasElement>('rndvid') // TODO rename

abstract class RendererBase {
  static id: string

  rendererNotSupported (id: string): Error {
    const msg = `renderer not supported: ${id}`
    alert(msg)
    return Error(msg)
  }

  abstract render (): void
}

class Renderer2D extends RendererBase {
  static id = '2d'

  private readonly context: CanvasRenderingContext2D

  constructor (private readonly canvas: HTMLCanvasElement) {
    super()
    const context = canvas.getContext('2d')
    if (!context) throw this.rendererNotSupported('2d')
    this.context = context
  }

  render (): void {
    const imageData = this.context.createImageData(this.canvas.width, this.canvas.height)
    for (let i = (this.canvas.width * this.canvas.height << 2) - 1; i; --i) {
      imageData.data[i] = !(~i & 3) ? 255 : ((Math.random() * 256) | 0)
    }
    this.context.putImageData(imageData, 0, 0)
  }
}

class RendererWebGL extends RendererBase {
  static id = 'webgl'

  private readonly context: WebGLRenderingContext

  constructor (private readonly canvas: HTMLCanvasElement) {
    super()
    const context = canvas.getContext('webgl')
    if (!context) throw this.rendererNotSupported('webgl')
    this.context = context
  }

  render (): void {
    // TODO
  }
}

class RendererWebGL2 extends RendererBase {
  static id = 'webgl2'

  private readonly context: WebGL2RenderingContext

  constructor (private readonly canvas: HTMLCanvasElement) {
    super()
    const context = canvas.getContext('webgl2')
    if (!context) throw this.rendererNotSupported('webgl2')
    this.context = context
  }

  render (): void {
    // TODO
  }
}

const renderers = [
  Renderer2D,
  RendererWebGL,
  RendererWebGL2,
]

/*
// TODO shader

float rand_float(inout uvec2 rvec) {
  rvec.x = 36969u * (rvec.x & 65535u) + (rvec.x >> 16u);
  rvec.y = 18000u * (rvec.y & 65535u) + (rvec.y >> 16u);
  return float((rvec.x << 16u) + rvec.y) / float(0xFFFFFFFFu);
}

void mainImage(out vec4 color, in vec2 coord) {
  vec2 offset = vec2(iTime,0.0);

  uvec2 rvec = uvec2(397.6432*(coord.xy+offset)) ^ uvec2(32.9875*(coord.yx+offset));

  color = vec4(rand_float(rvec), rand_float(rvec), rand_float(rvec),1.0);
}
*/

function resizeCanvas (): void {
  if (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) {
    // fullscreen mode
    $canvas.width = window.innerWidth
    $canvas.height = window.innerHeight
  } else {
    const parent = $canvas.parentNode! as HTMLElement
    $canvas.width = parent.clientWidth
    $canvas.height = parent.clientHeight
  }
}

$ready(function () {
  $selectRendererGroup.append(...renderers.map((Renderer, i) => {
    const $btn = document.createElement('button')
    $btn.innerText = Renderer.id
    $btn.className = `w-${i ? 50 : 100} btn btn-outline-${i ? 'secondary' : 'primary'}`
    $btn.onclick = () => {
      $selectRenderer.className = 'd-none'
      $canvas.className = ''

      const renderer = new Renderer($canvas)

      function renderLoop (): void {
        window.requestAnimationFrame(renderLoop)
        renderer.render()
      }

      $canvas.addEventListener('click', () => {
        $canvas.requestFullscreen()
          .then(resizeCanvas)
          .catch(() => {
            alert('fullscreen failed')
          })
      })

      resizeCanvas()
      renderLoop()
    }
    return $btn
  }))
})

window.onresize = resizeCanvas
