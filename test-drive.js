import https from 'https';

const id = '1VOj53Uc80PLAlt5aVjzyLnW_DmVIj8K-'; // Actual sample ID
const url = `https://drive.google.com/uc?export=download&id=${id}`;

const fetchDriveImage = (urlStr) => {
  return new Promise((resolve, reject) => {
    const getReq = (currentUrl) => {
      https.get(currentUrl, (proxyRes) => {
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          getReq(proxyRes.headers.location);
        } else {
          let data = [];
          proxyRes.on('data', chunk => data.push(chunk));
          proxyRes.on('end', () => {
            const buffer = Buffer.concat(data);
            resolve({ buffer, mimeType: proxyRes.headers['content-type'], statusCode: proxyRes.statusCode });
          });
          proxyRes.on('error', reject);
        }
      }).on('error', reject);
    };
    getReq(urlStr);
  });
};

fetchDriveImage(url).then(res => {
  console.log("Status:", res.statusCode);
  console.log("MimeType:", res.mimeType);
  console.log("Buffer Length:", res.buffer.length);
  const prefix = res.buffer.toString('utf8', 0, 100);
  console.log("Start of file:", prefix.replace(/\n/g, ' '));
}).catch(console.error);
