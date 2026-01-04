import { $idA, $ready } from './util'

const SHADER = `
// modified from https://www.shadertoy.com/view/ltB3zD
precision lowp float;

const float PHI = 1.61803398874989484820459;

float gold_noise(in vec2 xy, in float seed) {
  return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

void mainImage(out vec4 rgba, in vec2 xy) {
  float seed = fract(iTime);
  rgba = vec4(
    gold_noise(xy, seed+0.1),
    gold_noise(xy, seed+0.2),
    gold_noise(xy, seed+0.3),
    1 // gold_noise(xy, seed+0.4)
  );
}
`

const SHADER2 = `
// unknown source, but works on shadertoy.com

float rand_float(inout uvec2 rvec) {
  rvec.x = 36969u * (rvec.x & 65535u) + (rvec.x >> 16u);
  rvec.y = 18000u * (rvec.y & 65535u) + (rvec.y >> 16u);
  return float((rvec.x << 16u) + rvec.y) / float(0xFFFFFFFFu);
}

void mainImage(out vec4 color, in vec2 coord) {
  vec2 offset = vec2(iTime,0.0);

  uvec2 rvec = uvec2(397.6432*(coord.xy+offset)) ^ uvec2(32.9875*(coord.yx+offset));

  color = vec4(rand_float(rvec), rand_float(rvec), rand_float(rvec), 1.0);
}
`

const $canvas = $idA<HTMLCanvasElement>('rndvid')

type ContextType<ContextId extends string> =
  ContextId extends '2d' ? CanvasRenderingContext2D
  : ContextId extends 'webgl' ? WebGLRenderingContext
  : ContextId extends 'webgl2' ? WebGL2RenderingContext
  : RenderingContext

abstract class RendererBase<ContextId extends string> {
  static displayName: string

  protected readonly context: ContextType<ContextId>

  constructor (protected readonly canvas: HTMLCanvasElement, contextId: ContextId) {
    const context = canvas.getContext(contextId) as ContextType<ContextId> | null
    if (!context) throw RendererBase.rendererNotSupported(contextId)
    this.context = context
  }

  static rendererNotSupported (id: string): Error {
    const msg = `renderer not supported: ${id}`
    alert(msg)
    return Error(msg)
  }

  abstract render (): void
}

class Renderer2DCrypto extends RendererBase<'2d'> {
  static override displayName = '2d WebCrypto'

  constructor (canvas: HTMLCanvasElement) {
    super(canvas, '2d')
  }

  render (): void {
    const MAX_RAND_BYTES = 65536
    const buf = new Uint8Array(Math.min(MAX_RAND_BYTES, this.canvas.width * this.canvas.height * 3))
    let r = MAX_RAND_BYTES

    const imageData = this.context.createImageData(this.canvas.width, this.canvas.height)
    for (let i = (this.canvas.width * this.canvas.height << 2) - 1; i; --i) {
      let c = 255
      if (~i & 3) {
        if (r === MAX_RAND_BYTES) {
          r = 0
          crypto.getRandomValues(buf)
        }

        c = buf[r++]
      }
      imageData.data[i] = c
    }
    this.context.putImageData(imageData, 0, 0)
  }
}

class Renderer2DMath extends RendererBase<'2d'> {
  static override displayName = '2d Math.random'

  constructor (canvas: HTMLCanvasElement) {
    super(canvas, '2d')
  }

  render (): void {
    const imageData = this.context.createImageData(this.canvas.width, this.canvas.height)
    for (let i = (this.canvas.width * this.canvas.height << 2) - 1; i; --i) {
      imageData.data[i] = !(~i & 3) ? 255 : ((Math.random() * 256) | 0)
    }
    this.context.putImageData(imageData, 0, 0)
  }
}

abstract class RendererBaseGL<ContextId extends 'webgl' | 'webgl2'> extends RendererBase<ContextId> {
  protected lTime: WebGLUniformLocation | null
  protected initialTime: number

  constructor (canvas: HTMLCanvasElement, contextId: ContextId, vertexShaderSource: string, fragmentShaderSource: string) {
    super(canvas, contextId)

    function createShader (type: GLenum, source: string) {
      const shader = gl.createShader(type)
      if (!shader) throw new Error('failed to create shader')
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
        console.log(source)
        gl.deleteShader(shader)
        throw new Error('failed to compile shader')
      }
      return shader
    }

    const gl = this.context
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

    // create program
    const program = gl.createProgram()
    if (!program) throw new Error('failed to create program')
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      throw new Error('failed to link program')
    }

    gl.useProgram(program)
    this.lTime = gl.getUniformLocation(program, 'iTime')

    this.initialTime = RendererBaseGL.currentTime()

    const tri = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, tri)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    // gl.bindBuffer(gl.ARRAY_BUFFER, null)

    const vpos = gl.getAttribLocation(program, 'pos')
    gl.vertexAttribPointer(vpos, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vpos)
  }

  render (): void {
    const gl = this.context
    gl.uniform1f(this.lTime, (RendererBaseGL.currentTime() - this.initialTime) / 1000.0)

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)

    // DrawFullScreenTriangle_XY
    // gl.bindBuffer(gl.ARRAY_BUFFER, tri)
    // gl.vertexAttribPointer(vpos, 2, gl.FLOAT, false, 0, 0)
    // gl.enableVertexAttribArray(vpos)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    // gl.disableVertexAttribArray(vpos)
    // gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  static currentTime (): number {
    return (performance || Date).now()
  }
}

class RendererWebGL extends RendererBaseGL<'webgl'> {
  static override displayName = 'webgl'

  constructor (canvas: HTMLCanvasElement) {
    const SHADER_HEADER = `
    #ifdef GL_ES
      precision highp float;
      precision highp int;
    #endif
    `

    const VERTEX_SHADER = 'attribute vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }'

    const FRAGMENT_SHADER_HEADER = `
    uniform float iTime;
    void mainImage(out vec4 c, in vec2 f);
    void main() {
      /*
      gl_FragColor = vec4(0.0,0.0,0.0,1.0);
      vec4 color = vec4(1e20);
      mainImage(color, gl_FragCoord.xy);
      color.w = 1.0;
      if(gl_FragColor.w<0.0) color=vec4(1.0,0.0,0.0,1.0);
      if(gl_FragColor.x<0.0) color=vec4(1.0,0.0,0.0,1.0);
      if(gl_FragColor.y<0.0) color=vec4(0.0,1.0,0.0,1.0);
      if(gl_FragColor.z<0.0) color=vec4(0.0,0.0,1.0,1.0);
      if(gl_FragColor.w<0.0) color=vec4(1.0,1.0,0.0,1.0);
      gl_FragColor = vec4(color.xyz,1.0);
      */
      mainImage(gl_FragColor, gl_FragCoord.xy);
    }
    `

    super(canvas, 'webgl', SHADER_HEADER + VERTEX_SHADER, SHADER_HEADER + FRAGMENT_SHADER_HEADER + SHADER)
  }
}

class RendererBaseGL2 extends RendererBaseGL<'webgl2'> {
  constructor (canvas: HTMLCanvasElement, shader: string) {
    const VERTEX_SHADER = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }'

    const SHADER_HEADER = `#version 300 es
    #ifdef GL_ES
      precision highp float;
      precision highp int;
      precision mediump sampler3D;
    #endif
    `

    const FRAGMENT_SHADER_HEADER = `
    uniform float iTime;
    void mainImage(out vec4 c, in vec2 f);
    out vec4 shadertoy_out_color;
    void main() {
      /*
      shadertoy_out_color = vec4(1.0,1.0,1.0,1.0);
      vec4 color = vec4(1e20);
      mainImage( color, gl_FragCoord.xy );
      if(shadertoy_out_color.x<0.0) color=vec4(1.0,0.0,0.0,1.0);
      if(shadertoy_out_color.y<0.0) color=vec4(0.0,1.0,0.0,1.0);
      if(shadertoy_out_color.z<0.0) color=vec4(0.0,0.0,1.0,1.0);
      if(shadertoy_out_color.w<0.0) color=vec4(1.0,1.0,0.0,1.0);
      shadertoy_out_color = vec4(color.xyz,1.0);
      */
      mainImage( shadertoy_out_color, gl_FragCoord.xy );
    }
    `

    super(canvas, 'webgl2', SHADER_HEADER + VERTEX_SHADER, SHADER_HEADER + FRAGMENT_SHADER_HEADER + shader)
  }
}

class RendererWebGL2 extends RendererBaseGL2 {
  static override displayName = 'webgl2'

  constructor (canvas: HTMLCanvasElement) {
    super(canvas, SHADER)
  }
}

class RendererWebGL2Alt extends RendererBaseGL2 {
  static override displayName = 'webgl2 alt'

  constructor (canvas: HTMLCanvasElement) {
    super(canvas, SHADER2)
  }
}

const renderers = [
  Renderer2DCrypto,
  Renderer2DMath,
  RendererWebGL,
  RendererWebGL2,
  RendererWebGL2Alt,
]

function resizeCanvas (): void {
  if (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) {
    // fullscreen mode
    $canvas.width = window.innerWidth
    $canvas.height = window.innerHeight
  } else {
    $canvas.width = 1
    $canvas.height = 1
    const parent = $canvas.parentNode! as HTMLElement
    const targetW = parent.clientWidth
    const targetH = parent.clientHeight
    $canvas.width = targetW * window.devicePixelRatio
    $canvas.height = targetH * window.devicePixelRatio
  }
}

$ready(function () {
  $idA<HTMLDivElement>('selectRendererGroup').append(...renderers.map((Renderer, i) => {
    const $btn = document.createElement('button')
    $btn.innerText = Renderer.displayName
    $btn.className = `w-${i ? 50 : 100} btn btn-outline-${i ? 'secondary' : 'primary'}`
    $btn.onclick = () => {
      $idA<HTMLDivElement>('selectRenderer').className = 'd-none'
      $idA<HTMLDivElement>('selectedRenderer').className = ''
      $canvas.className = ''

      const renderer = new Renderer($canvas)

      $canvas.addEventListener('click', () => {
        $canvas.requestFullscreen()
          .then(resizeCanvas)
          .catch(() => {
            alert('fullscreen failed')
          })
      })

      resizeCanvas()

      const renderLoop = () => {
        window.requestAnimationFrame(renderLoop)
        renderer.render()
      }
      renderLoop()
    }
    return $btn
  }))
})

window.onresize = resizeCanvas
