import fs from 'fs';
import { parse } from 'csv-parse/sync';

const CSV_FILES = [
  'Shopify redirects - Salisbury & Co.csv',
  'Shopify redirects - Yaxell.csv',
  'Shopify redirects - Wolstead (Ready).csv',
];

// { hostname: { pathname: destination } }
const redirectMap = {};
let totalSkipped = 0;
let totalErrors = 0;

for (const file of CSV_FILES) {
  console.log(`\nProcessing: ${file}`);

  if (!fs.existsSync(file)) {
    console.log(`  Skipping - file not found`);
    continue;
  }

  const csv = fs.readFileSync(file);
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    escape: '"',
    quote: '"'
  });

  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNumber = i + 2;

    if (!row['Source'] || !row['Redirect'] ||
        row['Source'].trim() === '' || row['Redirect'].trim() === '') {
      skippedCount++;
      continue;
    }

    try {
      const sourceUrl = new URL(row['Source'].trim());
      const hostname = sourceUrl.hostname; // e.g. "salisburyandco.com.au"
      const fromPath = sourceUrl.pathname.replace(/\/$/, '');

      const toUrl = row['Redirect'].trim();
      let toPath = toUrl;
      if (toUrl.startsWith('www.')) toPath = 'https://' + toUrl;

      if (!redirectMap[hostname]) redirectMap[hostname] = {};
      redirectMap[hostname][fromPath] = toPath;
    } catch (error) {
      console.log(`  Row ${rowNumber}: Error - ${error.message}`);
      errorCount++;
    }
  }

  console.log(`  Rows: ${records.length}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
  totalSkipped += skippedCount;
  totalErrors += errorCount;
}

fs.writeFileSync(
  'redirect-map.json',
  JSON.stringify(redirectMap, null, 2)
);

const totalRedirects = Object.values(redirectMap).reduce((sum, m) => sum + Object.keys(m).length, 0);
console.log(`\nHosts: ${Object.keys(redirectMap).join(', ')}`);
console.log(`Total redirects written: ${totalRedirects}`);
console.log(`Total skipped: ${totalSkipped}, Total errors: ${totalErrors}`);
