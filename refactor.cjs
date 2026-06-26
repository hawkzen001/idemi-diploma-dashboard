const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

const replacements = {
  'rgba(30, 41, 59, 0.95)': 'var(--table-header)',
  'rgba(255, 255, 255, 0.04)': 'var(--border-light)',
  'rgba(255, 255, 255, 0.05)': 'var(--surface-hover)',
  'rgba(255, 255, 255, 0.02)': 'var(--surface-hover)',
  'rgba(15, 23, 42, 0.4)': 'var(--input-bg)',
  'rgba(15, 23, 42, 0.6)': 'var(--input-bg)',
  'rgba(15, 23, 42, 0.8)': 'var(--bg-dark)',
  'rgba(99, 102, 241, 0.15)': 'var(--accent-bg)',
  'rgba(99, 102, 241, 0.3)': 'var(--accent-border)',
  'rgba(99, 102, 241, 0.1)': 'var(--accent-bg)',
  'rgba(16, 185, 129, 0.1)': 'var(--positive-bg)',
  'rgba(16, 185, 129, 0.2)': 'var(--positive-border)',
  'rgba(16, 185, 129, 0.3)': 'var(--positive-border)',
  'rgba(0, 0, 0, 0.1)': 'var(--shadow-color)',
  'rgba(0, 0, 0, 0.2)': 'var(--shadow-strong)',
  'rgba(0, 0, 0, 0.3)': 'var(--shadow-strong)',
  'rgba(30, 41, 59, 0.6)': 'var(--card-bg)'
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  css = css.replace(regex, value);
}

const variables = `
:root {
  --bg-dark: #f8fafc;
  --bg-gradient: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  --card-bg: rgba(255, 255, 255, 0.8);
  --card-border: rgba(0, 0, 0, 0.05);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --accent: #4f46e5;
  --accent-glow: rgba(79, 70, 229, 0.3);
  --positive: #059669;
  --negative: #dc2626;
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --surface-bg: rgba(255, 255, 255, 0.95);
  --surface-hover: rgba(0, 0, 0, 0.05);
  --border-light: rgba(0, 0, 0, 0.05);
  --border-color: rgba(0, 0, 0, 0.1);
  --accent-bg: rgba(79, 70, 229, 0.1);
  --accent-border: rgba(79, 70, 229, 0.2);
  --positive-bg: rgba(16, 185, 129, 0.1);
  --positive-border: rgba(16, 185, 129, 0.2);
  --input-bg: rgba(255, 255, 255, 0.6);
  --shadow-color: rgba(0, 0, 0, 0.05);
  --shadow-strong: rgba(0, 0, 0, 0.1);
  --table-header: rgba(241, 245, 249, 0.95);
}

[data-theme="dark"] {
  --bg-dark: #0f172a;
  --bg-gradient: radial-gradient(circle at top left, #1e1b4b, #0f172a);
  --card-bg: rgba(30, 41, 59, 0.6);
  --card-border: rgba(255, 255, 255, 0.08);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent: #6366f1;
  --accent-glow: rgba(99, 102, 241, 0.4);
  --positive: #10b981;
  --negative: #ef4444;

  --surface-bg: #0f172a;
  --surface-hover: rgba(255, 255, 255, 0.05);
  --border-light: rgba(255, 255, 255, 0.04);
  --border-color: rgba(255, 255, 255, 0.1);
  --accent-bg: rgba(99, 102, 241, 0.15);
  --accent-border: rgba(99, 102, 241, 0.3);
  --positive-bg: rgba(16, 185, 129, 0.1);
  --positive-border: rgba(16, 185, 129, 0.2);
  --input-bg: rgba(15, 23, 42, 0.6);
  --shadow-color: rgba(0, 0, 0, 0.2);
  --shadow-strong: rgba(0, 0, 0, 0.3);
  --table-header: rgba(30, 41, 59, 0.95);
}
`;

css = css.replace(/:root\s*\{[\s\S]*?\}/, variables);
fs.writeFileSync(cssPath, css);
console.log('CSS refactored for themeing');
