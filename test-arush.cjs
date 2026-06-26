const fs = require('fs');
const Papa = require('papaparse');
const https = require('https');

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1TRkzM1g8SBxy-DfcimxJ-l2UNHTHwgUOym1s7NglxCE/export?format=csv';

async function fetchLiveSheet() {
  return new Promise((resolve, reject) => {
    https.get(GOOGLE_SHEET_CSV_URL, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          let data = '';
          redirectRes.on('data', chunk => data += chunk);
          redirectRes.on('end', () => resolve(data));
        }).on('error', reject);
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }
    }).on('error', reject);
  });
}

async function check() {
  const rawCsv = await fetchLiveSheet();
  const parsed = Papa.parse(rawCsv, { header: true, skipEmptyLines: true });
  
  const emails = parsed.data.map(row => row['Email Address'] ? row['Email Address'].trim().toLowerCase() : undefined);
  console.log(`Live Sheet has ${parsed.data.length} rows.`);
  console.log(`Does it have anchitavk123@gmail.com? `, emails.includes('anchitavk123@gmail.com'));
  
  const arushRow = parsed.data.find(row => row['Email Address'] === 'anchitavk123@gmail.com');
  console.log('Arush Row Keys: ', Object.keys(arushRow || {}));
  console.log('Arush Row Data: ', arushRow);
}

check().catch(console.error);
