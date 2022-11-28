const fg = require('fast-glob')
const path = require('path')

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts')
const { WebpackManifestPlugin } = require('webpack-manifest-plugin')

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
    filename: devMode ? '[name].js' : '[name].[contenthash:10].js',
    path: path.resolve(__dirname, 'docs/assets/dist'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader',
          options: {
            preprocess: require('svelte-preprocess')({})
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.txt$/,
        use: 'raw-loader',
      },
    ],
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
    extensions: [ '.ts', '.mjs', '.js', '.svelte' ],
    fallback: {
      "http": false,
      "https": false,
      "url": false,
    },
  },
  devtool: false,
  plugins: [
    new WebpackManifestPlugin({
      fileName: path.resolve(__dirname, 'docs/_data/manifest.json'),
      generate (_seed, _files, entrypoints) {
        const js = {}
        const unknown = []

        for (const [k, files] of Object.entries(entrypoints)) {
          const entryJS = []
          const entryUnknown = []

          for (const f of files) {
            if (f.endsWith('.js')) {
              entryJS.push(f.slice(0, -3))
            } else if (!f.endsWith('.css')) {
              entryUnknown.push(f)
            }
          }

          if (entryJS.length) js[k] = entryJS
          if (entryUnknown.length) unknown.push([k, entryUnknown])
        }

        return {
          js,
          unknown: unknown.length ? Object.fromEntries(unknown) : undefined,
        }
      },
      serialize: JSON.stringify,
    }),
    new RemoveEmptyScriptsPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name]', // [name] already has .css suffix
      chunkFilename: devMode ? '[id].css' : '[id].[contenthash].css',
    }),
  ],
  optimization: {
    moduleIds: 'size',
    chunkIds: 'total-size',
    splitChunks: {
      chunks: devMode ? 'async' : 'all',
    },
  },
}
