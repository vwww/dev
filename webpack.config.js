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
  'game_slime',
  'game_t3',
  'misc_contest',
  'misc_ggroups',
  'misc_path',
  'misc_rndvid',
  'tools_base',
  'tools_gcd',
  'tools_ip',
  'tools_letter_count',
  'tools_ping',
  'tools_unit',
  'xkcd_map',
  'test'
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
    extensions: [ '.ts', '.js' ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'docs/assets/dist')
  }
}
