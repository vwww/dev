import { $idA } from './util'

import * as svgPanZoom from 'svg-pan-zoom'

const $pathSVG = $idA('pathSVG')
$pathSVG.addEventListener('load', () => {
  svgPanZoom($pathSVG, {
    zoomEnabled: true,
    controlIconsEnabled: true,
    fit: true,
    center: true,
  })
})
