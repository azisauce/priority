const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src/app/(authenticated)/debts/page.tsx');
const destDir = path.join(__dirname, 'src/app/(authenticated)/assets');
const destPath = path.join(destDir, 'page.tsx');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

let content = fs.readFileSync(srcPath, 'utf8');

// Replacements
content = content.replace(/DebtsPage/g, 'AssetsPage');
content = content.replace(/debts/g, 'assets');
content = content.replace(/Debts/g, 'Assets');
content = content.replace(/debt/g, 'asset');
content = content.replace(/Debt/g, 'Asset');
content = content.replace(/DEBT/g, 'ASSET');

// Undo the API endpoint renaming back to debts
content = content.replace(/\/api\/assets/g, '/api/debts');

// Ensure type=asset in GET requests
content = content.replace(/api\/debts\?\$\{params\.toString\(\)\}/g, 'api/debts?type=asset&${params.toString()}');

// In handleSubmitAsset: we need to ensure payload for asset includes type: "asset"
content = content.replace(/notes: assetForm\.notes\.trim\(\) \|\| null,/g, 'notes: assetForm.notes.trim() || null,\n      type: "asset",');

fs.writeFileSync(destPath, content);
console.log('Regenerated assets page.');
