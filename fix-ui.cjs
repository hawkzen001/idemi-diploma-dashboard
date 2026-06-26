const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

const replacements = {
  'background: rgba(99, 102, 241, 0.05);': 'background: var(--surface-hover);',
  'background: rgba(15, 23, 42, 0.3);': 'background: var(--surface-hover);',
  'border-color: rgba(16, 185, 129, 0.5);': 'border-color: var(--positive);',
  'background: rgba(99, 102, 241, 0.2);': 'background: var(--accent-border);',
  'border-color: rgba(99, 102, 241, 0.5);': 'border-color: var(--accent);',
  'color: #a5b4fc;': 'color: var(--accent);',
  'color: #e0e7ff !important;': 'color: var(--accent) !important;',
  'linear-gradient(135deg, #e0e7ff, #a5b4fc)': 'var(--title-gradient)'
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  css = css.replace(regex, value);
}

// Ensure the --title-gradient variables are added
const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
if (rootMatch && !css.includes('--title-gradient')) {
  const newRoot = rootMatch[0].replace(
    '--table-header: rgba(241, 245, 249, 0.95);', 
    '--table-header: rgba(241, 245, 249, 0.95);\n  --title-gradient: linear-gradient(135deg, #4f46e5, #6366f1);\n  --chart-grid: rgba(0,0,0,0.1);'
  );
  css = css.replace(rootMatch[0], newRoot);
}

const darkMatch = css.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/);
if (darkMatch && !css.includes('--title-gradient: linear-gradient(135deg, #e0e7ff, #a5b4fc)')) {
  const newDark = darkMatch[0].replace(
    '--table-header: rgba(30, 41, 59, 0.95);', 
    '--table-header: rgba(30, 41, 59, 0.95);\n  --title-gradient: linear-gradient(135deg, #e0e7ff, #a5b4fc);\n  --chart-grid: rgba(255,255,255,0.1);'
  );
  css = css.replace(darkMatch[0], newDark);
}

fs.writeFileSync(cssPath, css);
console.log('CSS UI fixes applied');
