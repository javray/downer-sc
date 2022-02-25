const express = require('express');
const app = express();
const port = process.env.PORT || '3003';

const DOMAIN = 'atomixhq.art';
const DOMAIN_AUX = 'atomtt.com';

const cloudscraper = require('cloudscraper');
const request = require('request');
const querystring = require('querystring');

const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36';

const UA = USER_AGENT;

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

const puppeteerPost = async(url, tid) => {

  return new Promise((final) => {
    puppeteer.launch(
    { headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
    ).then(async browser => {
      const page = await browser.newPage();

      await page.setRequestInterception(true);

      page.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.setUserAgent(UA);
      await page.setJavaScriptEnabled(true);

      await page.goto('https://atomtt.com/to.php', {waitUntil: 'networkidle2'});
      await page.waitForTimeout(10000);

      const result = await page.evaluate((tid) => {
        return new Promise((resolve) => {
          fetch("https://atomtt.com/to.php", {
            "headers": {
              "cache-control": "no-cache",
              "content-type": "application/x-www-form-urlencoded",
              "pragma": "no-cache",
              "upgrade-insecure-requests": "1"
            },
            "referrer": "https://atomtt.com/to.php?__cf_chl_tk=FqkFnPBOrzX9TsKQULZ6Z7Qiy1Q4b1AmoMpymV1c3D8-1645650467-0-gaNycGzNCpE",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": "t=" + tid,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
          }).then((response) => response.text()).then((data) => resolve(data));
        });
      }, tid);

      final(result);

      await browser.close();
    });
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
