const express = require('express');
const app = express();
const port = process.env.PORT || '3003';

const DOMAIN = 'atomixhq.art';
const DOMAIN_AUX = 'atomtt.com';

const cloudscraper = require('cloudscraper');
const request = require('request');
const querystring = require('querystring');

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

const flareSolverrPost = (url, tid) => {

  return new Promise((resolve) => {

    const options = {
      'method': 'POST',
      'url': 'http://downer.javray.com:8191/v1',
      'headers': {
        'Content-Type': 'application/json'
      },
      json: {
        cmd: 'request.post',
        url: url,
        maxTimeout: 60000,
        postData: 't=' + tid
      }
    };

    function callback(error, response, body) {
      resolve(body.solution.response.replace(/(<([^>]+)>)/gi, ''));
    }

    request(options, callback);
  });

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

  let result = await flareSolverrPost(req.query.url, req.query.tid);

  if (result === '') {
    await delay(2000);
    result = await flareSolverrPost(req.query.url, req.query.tid);
  }

  try {
    cloudscraper({method: 'GET',
      url: 'https://' + DOMAIN + result,
      encoding: null,
      headers
    }, async (err, response, body) => {

      if (body.toString().indexOf('announce') === -1) {

        if (req.query.try) {
          push('DOWNER-SC', 'Torrent incorrecto https://' + DOMAIN + result);
        }
        else {

          console.log('retry');

          try {
            body = await tryAgain('/post', req);
          }
          catch(e) {
            console(e);
          }
        }
      }

      if (body) {
        res.send(body.toString('base64'));
      }
      else {
        res.send('');
      }
    });
  }
  catch(e) {
    console.log(req.query.url);
    console.log(e);
  }
});

app.get('/push', async (req, res) => {
  push('DOWNER-SC', 'Prueba de envío de push');
  res.send('PUSH');
});

app.listen(port, () => {
  console.log(`DOWNER-SC listening on port ${port}`);
});
