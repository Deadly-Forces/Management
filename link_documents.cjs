const fs = require('fs');
const path = require('path');

const backendDir = 'd:/sih/backend';
const frontendDir = 'd:/sih/frontend';

// Update Backend getClaimDetails to return real documents
const demoControllerPath = path.join(backendDir, 'src/controllers/demoController.js');
let demoController = fs.readFileSync(demoControllerPath, 'utf8');
demoController = demoController.replace(
  'const extractions = await Extraction.find({ claimId: claim._id, tenantId: req.tenantId });',
  'const extractions = await Extraction.find({ claimId: claim._id, tenantId: req.tenantId });\n    const documents = await Document.find({ claimId: claim._id, tenantId: req.tenantId });'
);
demoController = demoController.replace(
  'res.json({ claim, extractions });',
  'res.json({ claim, extractions, documents });'
);
fs.writeFileSync(demoControllerPath, demoController);

// Update Frontend Cockpit.jsx to render real documents
const cockpitPath = path.join(frontendDir, 'src/pages/Cockpit.jsx');
let cockpitCode = fs.readFileSync(cockpitPath, 'utf8');

// Replace the hardcoded mock document view with the real one
cockpitCode = cockpitCode.replace(
  /const \{ claim, extractions \} = data;/,
  'const { claim, extractions, documents } = data;'
);

const newDocView = `
               {documents && documents.length > 0 ? (
                 <div className="w-full h-full flex flex-col gap-4">
                   {documents.map((doc, i) => (
                     <div key={i} className="flex-1 bg-white shadow-sm border border-gray-200 overflow-hidden rounded relative flex items-center justify-center">
                       {doc.fileUrl.match(/\\.(jpeg|jpg|gif|png)$/i) ? (
                         <img src={\`http://localhost:5000\${doc.fileUrl}\`} className="max-w-full max-h-full object-contain" alt="evidence" />
                       ) : (
                         <div className="text-center">
                           <FileText size={48} className="text-indigo-400 mx-auto mb-2" />
                           <p className="font-medium text-slate-700">{doc.fileName}</p>
                           <a href={\`http://localhost:5000\${doc.fileUrl}\`} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline">Open File</a>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               ) : (
                 isDeathClaim ? (
                   <div className="text-center mt-20 border-8 border-double border-gray-300 py-20 px-8">
                     <h2 className="text-3xl font-serif mb-4 uppercase tracking-widest font-bold">Certificate of Death</h2>
                     <p className="text-lg font-mono">STATE REGISTRY</p>
                   </div>
                 ) : (
                   <div className="text-center text-gray-500 font-bold text-xl mt-40">
                     AUTO_ESTIMATE.PDF
                   </div>
                 )
               )}
`;

cockpitCode = cockpitCode.replace(
  /\{isDeathClaim \? \([^]*?AUTO_ESTIMATE\.PDF\n\s*<\/div>\n\s*\)\}/,
  newDocView.trim()
);
// Import FileText in Cockpit if not there
if (!cockpitCode.includes('FileText')) {
  cockpitCode = cockpitCode.replace('CheckCircle2 } from \'lucide-react\'', 'CheckCircle2, FileText } from \'lucide-react\'');
}

fs.writeFileSync(cockpitPath, cockpitCode);
