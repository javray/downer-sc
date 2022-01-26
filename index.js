const express = require('express');
const app = express();
const port = process.env.PORT || '3003';

const cloudscraper = require('cloudscraper');

app.get('/', async (req, res) => {

  if (!req.query.url) {
    res.send('DOWNER-SC');
    return;
  }

  const url = new URL(req.query.url);

  const headers = {
    referer: url.origin + '/'
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

  cloudscraper({method: 'GET',
    url: req.query.url,
    encoding: null,
  }, function(err, response, body) {
    res.send(body.toString('base64'));
  });

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
