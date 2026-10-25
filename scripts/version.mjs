import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const write = (path, value) => writeFileSync(new URL(path, root), `${JSON.stringify(value, null, 2)}\n`);

export function nextVersion(version, part, direction = 1) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) throw new Error(`Versione non valida: ${version}`);
  const index = ['major', 'minor', 'patch'].indexOf(part);
  if (index < 0) throw new Error('Usa major, minor o patch.');
  const numbers = version.split('.').map(Number);
  numbers[index] += direction;
  if (numbers[index] < 0) throw new Error(`Impossibile decrementare ${part}: è già zero.`);
  for (let i = index + 1; i < numbers.length; i++) numbers[i] = 0;
  return numbers.join('.');
}

function main() {
  const [command = 'check', part = 'patch', title, ...highlights] = process.argv.slice(2);
  const pkg = read('package.json');
  const lock = read('package-lock.json');
  const changelog = read('src/assets/changelog.json');
  const current = changelog.releases.find((release) => release.id === changelog.current);
  if (!current) throw new Error('Release corrente assente dal changelog.');
  if (command === 'check') {
    nextVersion(pkg.version, 'patch');
    if (lock.version !== pkg.version || lock.packages[''].version !== pkg.version || current.version !== pkg.version) {
      throw new Error('Versioni non allineate tra package.json, lockfile e changelog.');
    }
    console.log(`Versioni allineate: ${pkg.version}`);
    return;
  }
  if (!['up', 'down'].includes(command)) throw new Error('Usa check, up o down.');
  const version = nextVersion(pkg.version, part, command === 'down' ? -1 : 1);
  if (changelog.releases.some((release) => release !== current && release.version === version)) {
    throw new Error(`La versione ${version} esiste già nel changelog.`);
  }
  if (command === 'up') {
    if (!title || !highlights.length) throw new Error('Specifica titolo e almeno una novità: npm run version:patch -- "Titolo" "Novità"');
    const release = {
      id: `v${version}`, version, date: new Date().toISOString().slice(0, 10),
      label: current.label, title, summary: title, highlights,
    };
    changelog.releases.unshift(release);
    changelog.current = release.id;
  } else {
    // Correct the current release number without deleting its notes or history.
    current.version = version;
    current.id = `v${version}`;
    changelog.current = current.id;
  }
  pkg.version = lock.version = lock.packages[''].version = version;
  write('package.json', pkg);
  write('package-lock.json', lock);
  write('src/assets/changelog.json', changelog);
  console.log(`Versione aggiornata: ${version}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
