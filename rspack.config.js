import fg from 'fast-glob'
import path from 'path'

import rspack from '@rspack/core'
import { RspackManifestPlugin } from 'rspack-manifest-plugin'

import sveltePreprocess from 'svelte-preprocess'

const __dirname = import.meta.dirname
const devMode = process.env.NODE_ENV !== 'production'

const entry = {}
for (let e of fg.sync('*.ts', { cwd: path.resolve(__dirname, 'scripts') })) {
  entry[e.slice(0, -3)] = './scripts/' + e
}

export default {
  mode: devMode ? 'development' : 'production',
  entry,
  output: {
    filename: devMode ? '[name].js' : '[name].[contenthash:10].js',
    path: path.resolve(__dirname, 'docs/pass/assets/dist'),
  },
  module: {
    rules: [
      {
        test: /\.svelte\.ts$/,
        use: [ 'svelte-loader', 'ts-loader' ],
      },
      {
        test: /(?<!\.svelte)\.ts$/,
        use: 'ts-loader',
      },
      {
        test: /\.svelte(?:\.js)?$/,
        use: {
          loader: 'svelte-loader',
          options: {
            compilerOptions: {
              dev: devMode
            },
            hotReload: devMode,
            preprocess: sveltePreprocess({})
          }
        },
      },
      {
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.css$/i,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.txt$/,
        type: 'asset/source',
      },
    ],
  },
  resolve: {
    tsConfig: path.resolve(__dirname, './tsconfig.json'),
    extensions: [ '.ts', '.mjs', '.js', '.svelte' ],
    mainFields: ['svelte', '...'],
    conditionNames: ['svelte', '...'],
    fallback: {
      'http': false,
      'https': false,
      'url': false,
    },
  },
  devtool: devMode ? 'source-map' : false,
  plugins: [
    new RspackManifestPlugin({
      fileName: path.resolve(__dirname, 'docs/_data/manifest.json'),
      generate (_seed, _files, entrypoints) {
        const js = {}
        const css = {}
        const unknown = {}

        for (const [k, files] of Object.entries(entrypoints)) {
          for (const f of files) {
            if (f.endsWith('.js')) {
              (js[k] ??= []).push(f.slice(0, -3))
            } else if (f.endsWith('.css')) {
              (css[k] ??= []).push(f.slice(0, -4))
            } else {
              (unknown[k] ??= []).push(f)
            }
          }
        }

        const globalSet = new Set(js.global ?? [])
        const jsNoGlobal = Object.fromEntries(
          Object.entries(js)
            .map(([k, v]) => [k, v.filter((f) => !globalSet.has(f))])
        )

        return {
          js,
          jsNoGlobal,
          css,
          unknown
        }
      },
      serialize: JSON.stringify,
    }),
    new rspack.CssExtractRspackPlugin({
      filename: '[name]', // [name] already has .css suffix
      chunkFilename: devMode ? '[id].css' : '[id].[contenthash].css',
    }),
    new rspack.ProgressPlugin(),
  ],
  optimization: {
    moduleIds: 'natural', // 'size',
    chunkIds: 'natural', // 'total-size',
    splitChunks: {
      chunks: devMode ? 'async' : 'all',
    },
  },
  performance: {
    maxEntrypointSize: 2 ** 20, // 1 MiB
    maxAssetSize: 2 ** 19, // 512 KiB
  },
}
