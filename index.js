const express = require('express');
const app = express();
const port = process.env.PORT || '3003';

const DOMAIN = 'atomixhq.art';
const DOMAIN_AUX = 'atomtt.com';

const cloudscraper = require('cloudscraper');
const request = require('request');
const querystring = require('querystring');
const decode = require('html-entities-decoder');

const puppeteer = require('puppeteer');

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

const jsonToCookieString = (json) => {
  return `${json.name}=${json.value}; domain=${json.domain}; path=${json.path}; expires=${new Date(json.expires * 1000).toUTCString()};${json.httpOnly ? ' httpOnly;' : ''}${json.secure? ' secure;' : ''}`;
};

const extraPrefsFirefox = {
    // Disable newtabpage
    "browser.newtabpage.enabled": false,
    "browser.startup.homepage": "about:blank",

    // Do not warn when closing all open tabs
    "browser.tabs.warnOnClose": false,

    // Disable telemetry
    "toolkit.telemetry.reportingpolicy.firstRun": false,

    // Disable first-run welcome page
    "startup.homepage_welcome_url": "about:blank",
    "startup.homepage_welcome_url.additional": "",

    // Detected !
    // // Disable images to speed up load
    // "permissions.default.image": 2,

    // Limit content processes to 1
    "dom.ipc.processCount": 1
};

const puppeteerOptions = {
  product: 'firefox',
  headless: true,
  timeout: 40000,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
};

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0';
//const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:97.0) Gecko/20100101 Firefox/97.0';

const puppeteerPost = async(url, tid) => {

  return new Promise((final) => {

    puppeteer.launch(Object.assign({}, puppeteerOptions, {extraPrefsFirefox: extraPrefsFirefox}))
    .then(async browser => {
      const page = await browser.newPage();
      await page.setUserAgent(UA);
      await page.setDefaultNavigationTimeout(puppeteerOptions.timeout / 2);
      try {
        await page.goto('https://atomtt.com/to.php', {waitUntil: 'domcontentloaded', timeout: puppeteerOptions.timeout});
        await page.waitForTimeout(5000);
      }
      catch (e) {
        await page.goto('https://atomtt.com/to.php', {waitUntil: 'domcontentloaded', timeout: puppeteerOptions.timeout});
        await page.waitForTimeout(10000);
      }

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

const flareSolverrPost = (url, tid) => {

  return new Promise((resolve) => {

    const options = flareSolverrOptions({
      headers: {},
      json: {
        cmd: 'request.post',
        session: 'downer',
        url: url,
        maxTimeout: 60000,
        postData: 't=' + tid
      }
    });

    function callback(error, response, body) {
      console.log(body.solution);
      resolve({
        partial : decode(body.solution.response.replace(/(<([^>]+)>)/gi, '')),
        userAgent: body.solution.userAgent,
        cookies: body.solution.cookies,
        headers: body.solution.headers
      });
    }

    request(options, callback);
  });

};

const flareSolverrGet = (url, headers) => {

  return new Promise((resolve) => {

    const options = flareSolverrOptions({
      headers: headers,
      json: {
        cmd: 'request.get',
        session: 'downer',
        url: url,
        maxTimeout: 60000
      }
    });

    function callback(error, response, body) {
      console.log(error);
      console.log(response);
      console.log(body);
      resolve();
    }

    request(options, callback);
  });
};

const flareSolverrOptions = (newOptions) => {

  const options = {
    method: 'POST',
    url: 'http://downer.javray.com:8191/v1',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return Object.assign({}, options, newOptions);
};

const flareSolverrInit = () => {

  return new Promise((resolve) => {

    const options = flareSolverrOptions({
      json: {
        cmd: 'sessions.destroy',
        session: 'downer'
      }
    });

    request(options, () => {

      const options = flareSolverrOptions({
        json: {
          cmd: 'sessions.create',
          session: 'downer'
        }
      });

      request(options, () => resolve());
    });
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

  let origin = url.origin;

  const headers = {
    referer: origin + '/',
  };

  /*
  let result = await flareSolverrPost(req.query.url, req.query.tid);

  console.log(result);

  let partial = await cloudscraperPost(req.query.url, Object.assign({}, result.headers, headers), req.query.tid);

  console.log(partial);

  result.partial = partial;

  //await flareSolverrGet('https://' + DOMAIN + result.partial, headers);
  */

  let result = await puppeteerPost(req.query.url, req.query.tid);

  try {
    cloudscraper({method: 'GET',
      url: 'https://' + DOMAIN + result,
      encoding: null,
      headers,
    }, async (err, response, body) => {

      if (body.toString().indexOf('announce') === -1) {

        if (req.query.try) {
          push('DOWNER-SC', 'Torrent incorrecto https://' + DOMAIN + result);
        }
        /*
        else {

          console.log('retry');

          try {
            body = await tryAgain('/post', req);
          }
          catch(e) {
            console(e);
          }
        }
        */
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
  }
});

app.get('/push', async (req, res) => {
  push('DOWNER-SC', 'Prueba de envío de push');
  res.send('PUSH');
});

app.listen(port, async () => {
  //await flareSolverrInit();
  console.log(`DOWNER-SC listening on port ${port}`);
});
