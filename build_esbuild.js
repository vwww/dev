// esbuild is faster than rspack
// but does not support `optimization.splitChunks`, resulting in much larger JS size
// so we just use it for CSS only

import fg from 'fast-glob'
import path from 'path'

import esbuild from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'

const __dirname = import.meta.dirname
const devMode = process.env.NODE_ENV !== 'production'

const entryCSS = {}
for (let e of fg.sync('*.scss', { cwd: path.resolve(__dirname, 'styles') })) {
  if (e.startsWith('_')) continue
  entryCSS[e.slice(0, -5)] = './styles/' + e
}

const config = {
  logLevel: 'error',
  minify: !devMode,
  entryPoints: entryCSS,
  outdir: 'docs/pass/assets/dist',
  bundle: true,
  loader: { '.png': 'file', '.svg': 'file' },
  plugins: [
    sassPlugin({ embedded: true }),
  ],
}

esbuild
  .build(config)
  .catch(() => process.exit(1))
