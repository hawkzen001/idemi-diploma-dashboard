import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'

const driveProxyPlugin = () => ({
  name: 'drive-proxy',
  configureServer(server) {
    server.middlewares.use('/api/fetch-drive-image', (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get('id');
      if (!id) {
        res.statusCode = 400;
        return res.end('Missing id');
      }
      
      const driveUrl = `https://drive.google.com/uc?export=download&id=${id}`;
      
      const fetchImage = (urlStr) => {
        https.get(urlStr, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            fetchImage(response.headers.location);
          } else {
            res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
            res.setHeader('Access-Control-Allow-Origin', '*');
            response.pipe(res);
          }
        }).on('error', (err) => {
          res.statusCode = 500;
          res.end('Error fetching image: ' + err.message);
        });
      };
      
      fetchImage(driveUrl);
    });
  }
});

export default defineConfig({
  plugins: [react(), driveProxyPlugin()],
})
