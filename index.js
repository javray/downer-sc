const express = require('express');
const app = express();
const port = process.env.PORT || '3003';

const DOMAIN = 'atomixhq.art';
const DOMAIN_AUX = 'atomtt.com';

const cloudscraper = require('cloudscraper');
const request = require('request');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

const cloudscraperPost = async (url, headers, tid) => {

  let result = '';

  try {
    result = await cloudscraper({
      method: 'POST',
      url,
      headers,
      form: {
        t: tid
      }
    });
  }
  catch(e) {
    console.log(url);
    console.log(e);
  }

  return result;
};

const push = (title, message) => {

  const DEVICE = process.env.DEVICE;
  const APIKEY = process.env.APIKEY;

  const auth = Buffer.from(APIKEY + ':', 'binary').toString('base64');

  const options = {
    'method': 'POST',
    'url': 'https://api.pushbullet.com/api/pushes',
    'headers': {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      'device_iden': DEVICE,
      'type': 'note',
      'title': title,
      'body': message
    }
  };

  function callback(error, response, body) {
    console.log(body);
  }

  request(options, callback);
};

const cloudscraperGet = async (url, headers) => {

  let result = '';

  try {
    result = await cloudscraper({
      method: 'GET',
      url,
      headers
    });
  }
  catch(e) {
    console.log(url);
    console.log(e);
  }

  return result;
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

  if (origin.indexOf(DOMAIN_AUX) !== -1) {
    origin = 'https://' + DOMAIN;
  }

  const headers = {
    referer: origin + '/'
  };

  let result = await cloudscraperGet(req.query.url, headers);

  if (result === '') {
    await delay(2000);
    result = await cloudscraperGet(req.query.url, headers);
  }

  res.send(result);

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
    origin = 'https://' + DOMAIN_AUX;
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
    console.log(req.query.url);
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

  let result = await cloudscraperPost(req.query.url, headers, req.query.tid);

  if (result === '') {
    await delay(2000);
    result = await cloudscraperPost(req.query.url, headers, req.query.tid);
  }

  try {
    cloudscraper({method: 'GET',
      url: 'https://' + DOMAIN + result,
      encoding: null,
      headers
    }, function(err, response, body) {
      if (body.toString().indexOf('announce') === -1) {
        push('DOWNER-SC', 'Torrent incorrecto https://' + DOMAIN + result);
      }
      res.send(body.toString('base64'));
    });
  }
  catch(e) {
    console.log(req.query.url);
    console.log(e);
  }
});

app.get('/push', async (req, res) => {
  push('DOWNER-SC', 'Prueba de envío de push');
  req.send('PUSH');
});

app.listen(port, () => {
  console.log(`DOWNER-SC listening on port ${port}`);
});
