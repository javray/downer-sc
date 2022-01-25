const express = require('express');
const app = express();
const port = process.env.PORT || '3003';

const cloudscraper = require('cloudscraper');

app.get('/', async (req, res) => {

  if (!req.query.url) {
    res.send('DOWNER-SC');
    return;
  }

  let result = '';

  try {
    result = await cloudscraper.get(req.query.url);
  }
  catch(e) {
    console.log(e);
  }
  finally {
    res.send(result);
  }

});

app.get('/img', async(reg, res) => {
  if (!req.query.url) {
    res.send('');
    return;
  }

  let result = null;

  try {
    result = await cloudscraper.get(req.query.url);
  }
  catch(e) {
    console.log(e);
  }
  finally {
    res.send(Buffer.from(result, 'binary'));
  }

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
