const express = require('express')
const app = express()
const port = process.env.PORT || '3003'

const cloudscraper = require('cloudscraper')

app.get('/', async (req, res) => {
  if (!req.query.url) {
    res.send('DOWNER-SC')
    return;
  }
  const result = await cloudscraper.get(req.query.url);
  res.send(result)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
