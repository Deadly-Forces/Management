const fs = require('fs');
const path = require('path');

const frontendDir = 'd:/sih/frontend';
const cockpitPath = path.join(frontendDir, 'src/pages/Cockpit.jsx');
let cockpitCode = fs.readFileSync(cockpitPath, 'utf8');

// If allVerified is true, we want to allow approval. 
// If it's false, we want to explain WHY the button is disabled.

const explanationHtml = `
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Verification Required</h3>
              {!allVerified && extractions.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
                  ⚠️ You must click <strong>Accept</strong> or <strong>Reject</strong> on every extracted line item below before you can approve the settlement.
                </div>
              )}
`;

cockpitCode = cockpitCode.replace(
  '<div>\n              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Verification Required</h3>',
  explanationHtml.trim()
);

fs.writeFileSync(cockpitPath, cockpitCode);
console.log('Cockpit UI updated to explain human verification constraints clearly.');
