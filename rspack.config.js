const fg = require('fast-glob')
const path = require('path')

const rspack = require('@rspack/core')
const { RspackManifestPlugin } = require('rspack-manifest-plugin')

const devMode = process.env.NODE_ENV !== 'production'

const entry = {}
for (let e of fg.sync('*.ts', { cwd: path.resolve(__dirname, 'scripts') })) {
  entry[e.slice(0, -3)] = './scripts/' + e
}
for (let e of fg.sync('*.scss', { cwd: path.resolve(__dirname, 'styles') })) {
  entry[e.slice(0, -5) + '.css'] = './styles/' + e
}

module.exports = {
  mode: devMode ? 'development' : 'production',
  entry,
  output: {
    path: path.resolve(__dirname, 'docs/assets/dist'),
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
            preprocess: require('svelte-preprocess')({})
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
        test: /\.s[ac]ss$/i,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              api: 'modern-compiler',
              implementation: require.resolve('sass-embedded'),
            },
          },
        ],
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
        type: 'asset/source'
      },
      {
        test: /\.png$/,
        type: 'asset/resource'
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

        for (const [k, files] of Object.entries(entrypoints)) {
          const entryJS = []
          const entryCSS = []

          for (const f of files) {
            if (f.endsWith('.js')) {
              entryJS.push(f.slice(0, -3))
            } else {
              entryCSS.push(f)
            }
          }

          if (entryJS.length) js[k] = entryJS
          if (entryCSS.length) css[k] = entryCSS
        }

        return {
          js,
          css,
        }
      },
      serialize: JSON.stringify,
    }),
    new rspack.CssExtractRspackPlugin({
      filename: '[name]', // [name] already has .css suffix
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
}
