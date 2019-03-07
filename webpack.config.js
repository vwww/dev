const path = require('path')
// const TerserPlugin = require('terser-webpack-plugin')

const entry = {}
for (let e of [
  'global',
  'packery',

  'bots_googuns',
  'bots_poke',
  'bots_poke_old',
  'bots_random',
  'game_fill',
  'game_t3',
  'misc_ggroups',
  'xkcd_map',
]) {
  entry[e] = './scripts/' + e + '.ts'
}

module.exports = {
  mode: 'production',
  entry: entry,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'docs/assets/dist')
  }
}
