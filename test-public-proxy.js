import fs from 'fs';
import https from 'https';

const id = '1a0TCXy4K8Fifg1gIf0CIW3DqsSonSPtm';
const targetUrl = encodeURIComponent(`https://drive.google.com/uc?export=download&id=${id}`);
// Let's try corsproxy.io
const url = `https://corsproxy.io/?${targetUrl}`;

const getReq = (urlStr) => {
  https.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      getReq(res.headers.location);
    } else {
      console.log("Status:", res.statusCode);
      console.log("Content-Type:", res.headers['content-type']);
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
         const buffer = Buffer.concat(data);
         console.log("Size:", buffer.length);
      });
    }
  }).on('error', e => console.error(e));
};
getReq(url);
