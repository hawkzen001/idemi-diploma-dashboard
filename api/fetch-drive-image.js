import https from 'https';

export default function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing drive file id' });
  }

  const url = `https://drive.google.com/uc?export=download&id=${id}`;

  const getReq = (urlStr) => {
    https.get(urlStr, (proxyRes) => {
      // Handle redirects automatically (Google Drive often redirects downloads)
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        getReq(proxyRes.headers.location);
      } else {
        // Pass the headers and pipe the image buffer
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/octet-stream');
        proxyRes.pipe(res);
      }
    }).on('error', (err) => {
      console.error('Proxy Error:', err);
      res.status(500).json({ error: 'Failed to fetch image from Google Drive' });
    });
  };

  getReq(url);
}
