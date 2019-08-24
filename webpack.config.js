const path = require('path')
// const TerserPlugin = require('terser-webpack-plugin')

const entry = {}
for (let e of [
  'global',
  'packery',

  'app',
  'bots_poke',
  'bots_poke_old',
  'game_fill',
  'game_slime',
  'game_t3',
  'misc_path',
  'misc_rndvid',
  'tools_ip',
  'tools_letter_count',
  'tools_ping',
  'tools_unit',
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
      },
      {
        test: /\.svelte$/,
        use: 'svelte-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.mjs', '.js', '.svelte' ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'docs/assets/dist')
  }
}
