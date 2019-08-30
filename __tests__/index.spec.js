const path = require('path')
const MemoryFS = require('memory-fs')
const webpack = require('webpack')
const UnusedFilesWebpackPlugin = require('../index')

const entry = path.resolve(__dirname, 'fixtures/app.js')

describe('UnusedFilesWebpackPlugin module', () => {
  it(
    'should work as expected',
    done => {
      const compiler = webpack({
        mode: 'development',
        context: path.resolve(__dirname, 'fixtures'),
        entry,
        output: {
          path: __dirname, // It will be in MemoryFS :)
        },
        plugins: [new UnusedFilesWebpackPlugin()],
      })
      compiler.outputFileSystem = new MemoryFS()

      compiler.run((err, stats) => {
        expect(err).toBeFalsy()

        const { warnings } = stats.compilation
        expect(warnings).toHaveLength(1)

        const [unusedFilesError] = warnings
        expect(unusedFilesError).toBeInstanceOf(Error)

        const { message } = unusedFilesError

        const containsExpected = ['unused.js', 'some.test.js'].every(filename =>
          message.match(filename)
        )
        expect(containsExpected).toBeTruthy()

        done()
      })
    },
    10000
  )

  describe('options.patterns', () => {
    it(
      'should work as expected patterns',
      done => {
        const compiler = webpack({
          context: path.resolve(__dirname, 'fixtures'),
          mode: 'development',
          entry,
          output: {
            path: __dirname,
          },
          plugins: [
            new UnusedFilesWebpackPlugin({
              patterns: ['**/*.*', '!*.test.js'],
            }),
          ],
        })
        compiler.outputFileSystem = new MemoryFS()

        compiler.run((err, stats) => {
          expect(err).toBeFalsy()

          const { warnings } = stats.compilation
          expect(warnings).toHaveLength(1)

          const [unusedFilesError] = warnings
          expect(unusedFilesError).toBeInstanceOf(Error)

          const { message } = unusedFilesError
          expect(message).toMatchSnapshot()

          done()
        })
      },
      10000
    )
  })
})
