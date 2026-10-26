import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const app = path.resolve('src/app');
const features = path.join(app, 'features');
const violations = [];

function* files(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* files(name);
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) yield name;
  }
}

function featureOf(file) {
  const relative = path.relative(features, file);
  return relative.startsWith('..') ? null : relative.split(path.sep)[0];
}

for (const file of files(app)) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const owner = featureOf(file);
  const layer = path.relative(app, file).split(path.sep)[0];
  function inspect(node) {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
      specifier = node.arguments[0];
    if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith('.')) {
      const target = path.resolve(path.dirname(file), specifier.text);
      const targetFeature = featureOf(target);
      let reason;
      if (targetFeature && ['core', 'shared'].includes(layer)) {
        reason = `${layer} must not depend on a feature`;
      } else if (owner && targetFeature && owner !== targetFeature) {
        const entry = path.relative(path.join(features, targetFeature), target).replace(/\.ts$/, '');
        if (!['api', 'ui'].includes(entry)) reason = `use ${targetFeature}/api or ${targetFeature}/ui`;
      } else if (
        owner &&
        (target.startsWith(path.join(app, 'layouts') + path.sep) || target === path.join(app, 'app.routes'))
      ) {
        reason = 'features must not depend on the application shell';
      }
      if (reason) {
        const { line } = source.getLineAndCharacterOfPosition(specifier.getStart(source));
        violations.push(`${path.relative(process.cwd(), file)}:${line + 1}: ${reason} (${specifier.text})`);
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(source);
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Architecture checks passed: feature boundaries, core and shared dependencies.');
}
