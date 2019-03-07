import 'leaflet'

declare module 'leaflet' {
  namespace Control {
    interface MiniMapOptions extends ControlOptions {
      position?: ControlPosition // default: 'bottomright'
      toggleDisplay?: boolean // default: false
      zoomLevelOffset?: number // default: -5
      zoomLevelFixed?: boolean // default: false
      centerFixed?: boolean // default: false
      zoomAnimation?: boolean // default: false
      autoToggleDisplay?: boolean // default: false
      minimized?: boolean // default: false
      width?: number // default: 150
      height?: number // default: 150
      collapsedWidth?: number // default: 19
      collapsedHeight?: number // default: 19
      // aimingRectOptions?: object // default: {color: '#ff7800', weight: 1, interactive: false}
      // shadowRectOptions?: object // default: {color: '#000000', weight: 1, interactive: false, opacity: 0, fillOpacity: 0}
      // strings?: object // default: {hideText: 'Hide MiniMap', showText: 'Show MiniMap'}
      // mapOptions?: object // default: {}
    }

    class MiniMap extends Control {
      options: MiniMapOptions
      constructor (layer: TileLayer | LayerGroup, options?: MiniMapOptions)
    }
  }
}
