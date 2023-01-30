import 'leaflet'

declare module 'leaflet' {
  class CanvasLayer extends GridLayer { }

  const canvasLayer: (options: CanvasLayerOptions) => CanvasLayer

  interface CanvasLayerOptions extends GridLayerOptions {
    drawTile (ctx: CanvasRenderingContext2D, coords: Coords): void
  }
}
