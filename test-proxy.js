import fs from 'fs';
import https from 'https';
import Papa from 'papaparse';

const fetchImage = (id) => {
  return new Promise((resolve, reject) => {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    const getReq = (urlStr) => {
      https.get(urlStr, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          getReq(res.headers.location);
        } else {
          resolve({ status: res.statusCode, mime: res.headers['content-type'] });
        }
      }).on('error', reject);
    };
    getReq(url);
  });
};

const data = fs.readFileSync('temp2.csv', 'utf8');
const results = Papa.parse(data, {header: false});
const ids = results.data
  .map(r => r[8]) // index 8 is SSC Result
  .filter(v => v && v.includes('id='))
  .map(v => new URL(v).searchParams.get('id'));

async function testAll() {
  console.log(`Found ${ids.length} marksheet IDs. Testing first 5...`);
  for (let i = 0; i < Math.min(5, ids.length); i++) {
    const id = ids[i];
    try {
      const { status, mime } = await fetchImage(id);
      console.log(`ID: ${id} | Status: ${status} | MimeType: ${mime}`);
    } catch (e) {
      console.error(`ID: ${id} | Error: ${e.message}`);
    }
  }
}

testAll();
