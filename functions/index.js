const functions = require('firebase-functions')

exports.index = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!")
})