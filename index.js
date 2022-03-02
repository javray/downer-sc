const express = require('express');
const app = express();
const port = process.env.PORT || '3003';

const DOMAIN = 'atomixhq.link';
const DOMAIN_AUX = 'atomtt.com';

const cloudscraper = require('cloudscraper');
const request = require('request');
const querystring = require('querystring');
const decode = require('html-entities-decoder');

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

const downerGet = (url, tid) => {

  return new Promise((resolve) => {

    const options = {
      method: 'GET',
      url: 'http://downer.javray.com:3003/post?url=' + url + '&tid=' + tid,
    };

    function callback(error, response, body) {
      resolve(body);
    }

    request(options, callback);
  });
};

const cloudscraperPost = async (url, headers, tid) => {

  let result = '';

  const j = cloudscraper.jar();

  j.setCookie(headers.Cookie, 'http://atomtt.com/to.php');

  try {
    result = await cloudscraper({
      jar: j,
      method: 'POST',
      url,
      headers,
      form: {
        t: tid
      }
    });
  }
  catch(e) {
    console.log('ERROR: ' + url + '(' + tid + ')');
  }

  return result;
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

  request(options);
};

const tryAgain = (endpoint, req) => {
  return new Promise((resolve, reject) => {
    const url = req.protocol + '://' + req.headers.host + endpoint + '?' + querystring.stringify(req.query) + '&try=1';
    console.log(url);
    request.get(url, (error, response, body) => resolve(body));
  });
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

  let result = await downerGet(req.query.url, req.query.tid);

  res.send(result);
});

app.get('/push', async (req, res) => {
  push('DOWNER-SC', 'Prueba de envío de push');
  res.send('PUSH');
});

app.listen(port, async () => {
  console.log(`DOWNER-SC listening on port ${port}`);
});
