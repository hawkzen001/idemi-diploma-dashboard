const https = require('https');

const postData = JSON.stringify({
  id: 'test_id',
  eligibility: 'Eligible'
});

const options = {
  hostname: 'idemi-diploma-dashboard.vercel.app',
  port: 443,
  path: '/api/save-eligibility-data',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
