const fs = require('fs');
const path = require('path');

const frontendDir = 'd:/sih/frontend';
const cockpitPath = path.join(frontendDir, 'src/pages/Cockpit.jsx');

let cockpitCode = fs.readFileSync(cockpitPath, 'utf8');

// The API currently returns { claim, extractions } from getClaimDetails. 
// We should update getClaimDetails in backend to also return documents, but we can also just fetch them or use a fallback.
// Since backend getClaimDetails doesn't return documents right now, I need to update getClaimDetails first.
