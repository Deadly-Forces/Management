const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'frontend/src/pages/Cockpit.jsx');
let content = fs.readFileSync(targetPath, 'utf-8');

// The ultimate dark theme refactor script
content = content.replace(/bg-slate-50/g, 'bg-canvas');
content = content.replace(/bg-white/g, 'bg-panel');
content = content.replace(/border-slate-200/g, 'border-border');
content = content.replace(/border-slate-100/g, 'border-border');
content = content.replace(/text-slate-900/g, 'text-white');
content = content.replace(/text-slate-800/g, 'text-gray-100');
content = content.replace(/text-slate-700/g, 'text-gray-200');
content = content.replace(/text-slate-600/g, 'text-gray-300');
content = content.replace(/text-slate-500/g, 'text-gray-400');
content = content.replace(/text-slate-400/g, 'text-gray-500');
content = content.replace(/text-slate-300/g, 'text-gray-600');

content = content.replace(/bg-slate-100/g, 'bg-surface');
content = content.replace(/bg-slate-900/g, 'bg-canvas');

content = content.replace(/bg-indigo-600/g, 'bg-primary');
content = content.replace(/text-indigo-600/g, 'text-primary');
content = content.replace(/bg-indigo-50/g, 'bg-primary/10');
content = content.replace(/text-indigo-700/g, 'text-primary-text');
content = content.replace(/text-indigo-400/g, 'text-primary-hover');

content = content.replace(/shadow-sm/g, 'shadow-panel');

content = content.replace(/bg-rose-50/g, 'bg-danger-bg');
content = content.replace(/border-rose-200/g, 'border-danger-border');
content = content.replace(/text-rose-600/g, 'text-danger');
content = content.replace(/text-rose-700/g, 'text-danger');
content = content.replace(/text-rose-800/g, 'text-danger');

content = content.replace(/bg-emerald-50\/30/g, 'bg-success-bg');
content = content.replace(/border-emerald-200/g, 'border-success-border');
content = content.replace(/text-emerald-700/g, 'text-success');

content = content.replace(/bg-amber-50/g, 'bg-warning-bg');
content = content.replace(/border-amber-200/g, 'border-warning-border');
content = content.replace(/text-amber-900/g, 'text-warning');
content = content.replace(/text-amber-600/g, 'text-warning');
content = content.replace(/bg-orange-50/g, 'bg-warning-bg');
content = content.replace(/border-orange-200/g, 'border-warning-border');
content = content.replace(/text-orange-600/g, 'text-warning');
content = content.replace(/text-orange-700/g, 'text-warning');
content = content.replace(/text-orange-800/g, 'text-warning');


fs.writeFileSync(targetPath, content);
console.log('Successfully updated Cockpit.jsx to Dark Enterprise Theme');
