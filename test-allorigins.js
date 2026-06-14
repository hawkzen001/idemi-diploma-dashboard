import https from 'https';

const id = '1a0TCXy4K8Fifg1gIf0CIW3DqsSonSPtm';
const targetUrl = encodeURIComponent(`https://drive.google.com/uc?export=download&id=${id}`);
const url = `https://api.allorigins.win/raw?url=${targetUrl}`;

const getReq = (urlStr) => {
  https.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
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
