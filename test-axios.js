import axios from 'axios';

async function test() {
  try {
    const id = '1xCxlJ7a7E09s4b4FS5RZ2w1Xx-3MUOYP';
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    console.log("Fetching", url);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    console.log("Status:", response.status);
    console.log("Length:", response.data.length);
  } catch (error) {
    console.error("Failed:", error.response ? error.response.status : error.message);
  }
}
test();
