import 'leaflet'

declare module 'leaflet' {
  class XKCDTileLayer extends TileLayer { }

  const xkcdTileLayer: (options: XKCDTileLayerOptions) => XKCDTileLayer

  interface XKCDTileLayerOptions extends TileLayerOptions {
    hasTile (zoom: number, x: number, y: number): boolean
  }
}
