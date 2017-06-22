const functions = require('firebase-functions')

const fs = require('fs')
const path = require('path')
const LRU = require('lru-cache')
const template = fs.readFileSync(path.resolve(__dirname, './index.template.html'), 'utf-8')
const { createBundleRenderer } = require('vue-server-renderer')
const bundle = require('./dist/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/vue-ssr-client-manifest.json')
const renderer = createBundleRenderer(bundle, {
    template,
    cache: LRU({
        max: 1000,
        maxAge: 1000 * 60 * 15
    }),
    clientManifest,
    basedir: path.resolve('./dist'),
    runInNewContext: false,
})

const microCache = LRU({
    max: 100,
    maxAge: 1000
})

exports.index = functions.https.onRequest((req, res) => {
    const s = Date.now()

    res.setHeader('content-type', 'text/html')
    res.setHeader('cache-control', 'public, max-age=300, s-maxage=600')

    const handleError = err => {
        if (err.url) {
            res.redirect(err.url)
        } else if (err.code == 404) {
            res.status(404).end('404 | Page Not Found')
        } else {
            res.status(500).end('500')
            console.error(`error : ${req.url}`)
            console.error(err.stack)
        }
    }

    const context = {
        title: 'Vue HN 2.0',
        url: req.url,
    }
    renderer.renderToString(context, (err, html) => {
        if (err) {
            return handleError(err)
        }
        res.end(html)
        console.log(`whole request: ${Date.now() - s}ms`)
    })
})