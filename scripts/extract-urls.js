const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function main() {
    // --- Argument Parsing ---
    const args = process.argv.slice(2);
    const columnsArgIndex = args.indexOf('--columns');

    if (columnsArgIndex === -1 || args.length <= columnsArgIndex + 1) {
        console.error('Usage: node scripts/extract-urls.js --columns "Column Name 1,Column Name 2"');
        process.exit(1);
    }

    const columnNames = args[columnsArgIndex + 1].split(',').map(name => name.trim());
    const dataFilePath = path.join(__dirname, '..', 'data', 'sds.csv');

    // --- File Reading ---
    let fileContent;
    try {
        fileContent = fs.readFileSync(dataFilePath, 'utf8');
    } catch (error) {
        console.error(`Error reading data file at: ${dataFilePath}`);
        console.error(error.message);
        process.exit(1);
    }

    // --- CSV Parsing ---
    Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        complete: (results) => {
            if (results.errors.length > 0) {
                console.error('Errors encountered during CSV parsing:');
                console.error(results.errors);
                process.exit(1);
            }

            const urls = new Set();

            // --- URL Extraction ---
            results.data.forEach(row => {
                columnNames.forEach(columnName => {
                    const url = row[columnName];
                    if (url) {
                        urls.add(url.trim());
                    }
                });
            });

            // --- Output ---
            urls.forEach(url => {
                console.log(url);
            });
        }
    });
}

main();
