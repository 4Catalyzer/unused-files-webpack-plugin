const path = require('path')
const { promisify } = require('util')
const nativeGlobAll = require('glob-all')

const globAll = promisify(nativeGlobAll)

function globOptionsWith(compiler, globOptions) {
  return {
    cwd: compiler.context,
    ...globOptions,
  }
}

function getFileDepsMap(compilation) {
  const fileDepsBy = [...compilation.fileDependencies].reduce(
    (acc, usedFilepath) => {
      acc[usedFilepath] = true
      return acc
    },
    {}
  )

  const { assets } = compilation
  Object.keys(assets).forEach(assetRelpath => {
    const existsAt = assets[assetRelpath].existsAt
    fileDepsBy[existsAt] = true
  })
  return fileDepsBy
}

class UnusedFilesWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      ...options,
      patterns: options.patterns || [`**/*.*`],
      failOnUnused: options.failOnUnused === true,
    }

    this.globOptions = {
      ignore: `node_modules/**/*`,
      ...options.globOptions,
    }
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise(
      'UnusedFilesWebpackPlugin',
      async compilation => {
        try {
          const globOptions = globOptionsWith(compiler, this.globOptions)
          const fileDepsMap = getFileDepsMap(compilation)

          const files = await globAll(
            this.options.patterns || this.options.pattern,
            globOptions
          )
          const unused = files.filter(
            it => !fileDepsMap[path.join(globOptions.cwd, it)]
          )

          if (unused.length !== 0) {
            throw new Error(`
UnusedFilesWebpackPlugin found some unused files:
${unused.join(`\n`)}`)
          }
        } catch (error) {
          if (this.options.failOnUnused && compilation.bail) {
            throw error
          }

          const errorsList = this.options.failOnUnused
            ? compilation.errors
            : compilation.warnings
          errorsList.push(error)
        }
      }
    )
  }
}

module.exports = UnusedFilesWebpackPlugin
