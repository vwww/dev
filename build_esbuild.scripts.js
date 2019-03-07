// not used
// esbuild is faster than rspack but does not support `optimization.splitChunks`, resulting in much larger JS size

import fg from 'fast-glob'
import path from 'path'

import esbuild from 'esbuild'
import esbuildSvelte from 'esbuild-svelte'
import sveltePreprocess from 'svelte-preprocess'
import manifestPlugin from 'esbuild-plugin-manifest'

const __dirname = import.meta.dirname
const devMode = process.env.NODE_ENV !== 'production'

const entryPoints = {}
for (let e of fg.sync('*.ts', { cwd: path.resolve(__dirname, 'scripts') })) {
  entryPoints[e.slice(0, -3)] = './scripts/' + e
}

const config = {
  // mode: devMode ? 'development' : 'production',
  minify: !devMode,
  entryPoints,
  entryNames: '[name]',
  outdir: 'docs/assets/dist',
  bundle: true,
  loader: { '.png': 'file' },
  plugins: [
    manifestPlugin({
      filename: path.resolve(__dirname, 'docs/_data/manifest.json'),
      generate (entrypoints) {
        const js = {}
        const other = {}

        for (const [k, f] of Object.entries(entrypoints)) {
          // TODO fix key (k doesn't correspond to key in entryJS)
          if (f.endsWith('.js')) {
            js[k] = [f.slice(0, -3)]
          } else {
            other[k] = f
          }
        }

        return {
          js,
          other,
        }
      },
	  shortNames: true,
    }),
    esbuildSvelte({
      preprocess: sveltePreprocess(),
    }),
  ],
}

esbuild
  .build(config)
  .catch(() => process.exit(1))
