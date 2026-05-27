const { createServer } = require('http')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '127.0.0.1'
const port = Number.parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      await handle(req, res)
    } catch (error) {
      console.error('Request handling failed:', error)
      res.statusCode = 500
      res.end('Internal server error')
    }
  }).listen(port, () => {
    console.log(`Larry Academy is running on http://${hostname}:${port}`)
  })
})
