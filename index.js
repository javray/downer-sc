const express = require('express')
const app = express()
const port = process.env.PORT || '3003'

//const cloudscraper = require('cloudscraper')

app.get('/', (req, res) => {
  //const result = await cloudscraper.get(req.query.url)
  //res.send(result)
  res.send('hola')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
