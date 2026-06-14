import https from 'https';

const id = '1a0TCXy4K8Fifg1gIf0CIW3DqsSonSPtm'; // Example from earlier
const url = `https://drive.google.com/uc?export=download&id=${id}`;

const getReq = (urlStr) => {
  https.get(urlStr, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      getReq(res.headers.location);
    } else {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => console.log(res.headers['content-type'], data.substring(0, 200)));
    }
  });
};
getReq(url);
