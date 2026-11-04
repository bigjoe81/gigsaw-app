const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const fail = message => { throw new Error(message); };
if (!/^\d+\.\d+\.\d+$/.test(process.env.APP_VERSION || '')) fail('Impostare mobile_version (X.Y.Z) nella pipeline CircleCI.');
if (!['test', 'prod'].includes(process.env.MOBILE_DESTINATION)) fail('Destinazione non valida.');
// Evita pubblicazioni da branch di lavoro; il deploy viene richiesto esplicitamente.
if (process.env.MOBILE_DESTINATION === 'prod' && process.env.CIRCLE_BRANCH !== 'main') fail('Il deploy prod deve partire dal branch main.');
if (process.env.LIVE_NATIVE !== 'true') {
  const angular = JSON.parse(fs.readFileSync(path.join(root, 'angular.json'), 'utf8'));
  const name = process.env.LIVE_ANGULAR_PROJECT || 'live';
  if (!angular.projects?.[name]) fail(`Manca il progetto Ionic/Angular '${name}': generarlo in apps/live prima di attivare il deploy.`);
  const live = path.resolve(root, process.env.LIVE_APP_DIR || 'apps/live');
  if (!['ts', 'js', 'json'].some(ext => fs.existsSync(path.join(live, `capacitor.config.${ext}`)))) fail(`Manca capacitor.config in ${live}.`);
}
console.log('Prerequisiti Live verificati.');
