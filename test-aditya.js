import fs from 'fs';
import Papa from 'papaparse';

const data = fs.readFileSync('temp2.csv', 'utf8');
const results = Papa.parse(data, {header: false});
const rows = results.data.filter(r => r && r[2]);

let index = -1;
for (let i = 0; i < rows.length; i++) {
  if (rows[i][2].toUpperCase().includes('ADITYA ASHOK AUCHARE')) {
    index = i;
    break;
  }
}

if (index !== -1) {
  console.log("Found ADITYA at index", index);
  console.log("Next 3 rows:");
  for (let i = 1; i <= 3; i++) {
    const r = rows[index + i];
    if (r) {
      console.log(`Name: ${r[2]}, Link: ${r[8]}`);
    }
  }
} else {
  console.log("Not found.");
}
