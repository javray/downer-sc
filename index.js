const express = require('express');
const app = express();
const port = process.env.PORT || '3003';

const cloudscraper = require('cloudscraper');

const checkURL = (url) => {

  let urlLocal = null;

  try {
    urlLocal = new URL(url);
  }
  catch(e) {
    console.log(e);
  }

  return urlLocal;
};

app.get('/', async (req, res) => {

  if (!req.query.url) {
    res.send('DOWNER-SC');
    return;
  }

  const url = checkURL(req.query.url);

  if (url === null) {
    res.status(400);
    res.end('Invalid URL');
    return;
  }

  let origin = url.origin;

  if (origin.indexOf('atomtt.com') !== -1) {
    origin = 'https://atomixhq.art';
  }

  const headers = {
    referer: origin + '/'
  };

  let result = '';

  try {
    result = await cloudscraper({
      method: 'GET',
      url: req.query.url,
      headers
    });
  }
  catch(e) {
    console.log(e);
  }
  finally {
    res.send(result);
  }

});

app.get('/img', async(req, res) => {

  if (!req.query.url) {
    res.send('DOWNER-SC-IMG');
    return;
  }

  const url = checkURL(req.query.url);

  if (url === null) {
    res.status(400);
    res.end('Invalid URL');
    return;
  }

  let origin = url.origin;

  if (req.query.url.indexOf('.torrent') !== -1) {
    origin = 'https://atomtt.com';
  }

  const headers = {
    referer: origin + '/'
  };

  try {
    cloudscraper({method: 'GET',
      url: req.query.url,
      encoding: null,
      headers
    }, function(err, response, body) {
      res.send(body.toString('base64'));
    });
  }
  catch(e) {
    console.log(e);
  }

});

app.get('/post', async(req, res) => {

  if (!req.query.url) {
    res.send('DOWNER-SC-POST');
    return;
  }

  const url = checkURL(req.query.url);

  if (url === null) {
    res.status(400);
    res.end('Invalid URL');
    return;
  }

  let origin = url.origin;

  const headers = {
    referer: origin + '/'
  };

  let result = '';

  try {
    result = await cloudscraper({
      method: 'POST',
      url: req.query.url,
      headers,
      form: {
        t: req.query.tid
      }
    });
  }
  catch(e) {
    console.log(e);
  }
  finally {
    res.send(result);
  }

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
