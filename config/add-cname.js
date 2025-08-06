const fs = require('fs');
const path = require('path');

const cnamePath = path.join(__dirname, '../docs/CNAME');
fs.writeFileSync(cnamePath, 'aatishacyrill.com');
console.log('CNAME file created in docs/');
