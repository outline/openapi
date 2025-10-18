const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

try {
    const readme = path.join(__dirname, '..', 'LICENSE');

    // look for "Copyright (c) <YEAR>" and update the year to the current year
    const currentYear = new Date().getFullYear();
    let licenseText = fs.readFileSync(readme, 'utf8');
    const updatedLicenseText = licenseText.replace(/Copyright \(c\) \d{4}/g, `Copyright (c) ${currentYear}`);

    if (licenseText === updatedLicenseText) {
        process.exit(0);
    }

    fs.writeFileSync(readme, updatedLicenseText, 'utf8');
    console.log(`Updated LICENSE file to current year: ${currentYear}`);
} catch (error) {
    console.error('Error updating LICENSE file:', error);
    process.exit(1);
}
