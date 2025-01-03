// esbuild is faster than rspack
// but does not support `optimization.splitChunks`, resulting in much larger JS size
// so we just use it for CSS only

const fg = require('fast-glob')
const path = require('path')

const esbuild = require('esbuild')
const { sassPlugin } = require('esbuild-sass-plugin')

const devMode = process.env.NODE_ENV !== 'production'

const entryCSS = {}
for (let e of fg.sync('*.scss', { cwd: path.resolve(__dirname, 'styles') })) {
  entryCSS[e.slice(0, -5)] = './styles/' + e
}

const config = {
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
