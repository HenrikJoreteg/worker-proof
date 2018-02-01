import buble from 'rollup-plugin-buble'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import serve from 'rollup-plugin-serve'

const getPlugins = (includeServe = false) => {
  const plugins = [
    buble({ jsx: 'h' }),
    nodeResolve({ jsnext: true, main: true }),
    commonjs()
  ]
  if (includeServe) {
    plugins.push(serve('example/public'))
  }
  return plugins
}

export default [
  {
    input: 'example/worker.js',
    output: {
      format: 'umd',
      file: 'example/public/worker.js' 
    },
    plugins: getPlugins()
  },
  {
    input: 'example/main.js',
    output: {
      format: 'umd',
      file: 'example/public/main.js' 
    },
    plugins: getPlugins(true)
  }
]
