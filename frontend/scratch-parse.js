const fs = require('fs');
const path = require('path');

const parser = require(path.join(__dirname, 'node_modules', '@babel', 'parser'));
const src = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'ContactPage.jsx'), 'utf8');

const ast = parser.parse(src, {
  sourceType: 'module',
  plugins: ['jsx'],
  errorRecovery: false,
});

const names = [];
for (const node of ast.program.body) {
  if (node.type === 'VariableDeclaration') {
    for (const d of node.declarations) {
      if (d.id.type === 'Identifier') names.push(`${d.id.name} (line ${d.loc.start.line})`);
    }
  } else if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
    names.push(`${node.id ? node.id.name : '?'} (line ${node.loc.start.line})`);
  } else if (node.type === 'ImportDeclaration') {
    names.push(`import ... (line ${node.loc.start.line})`);
  } else {
    names.push(`${node.type} (line ${node.loc.start.line})`);
  }
}
console.log('Top-level statements in order:');
names.forEach((n) => console.log('  ', n));

// Any duplicate declarations anywhere in the file?
const counts = {};
for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) {
  counts[m[1]] = (counts[m[1]] || 0) + 1;
}
const dupes = Object.entries(counts).filter(([, c]) => c > 1);
console.log('\nDuplicate declared names:', dupes.length ? dupes : 'none');