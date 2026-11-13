const fs = require('node:fs');
const dir = '/tmp/gigsaw-mobile-secrets';
const required = name => {
  if (!process.env[name]) throw new Error(`Variabile mancante: ${name}`);
  return process.env[name];
};
const google = Buffer.from(required('GOOGLE_PLAY_JSON_KEY_BASE64'), 'base64');
JSON.parse(google.toString('utf8'));
const keystore = Buffer.from(required('ANDROID_KEYSTORE_BASE64'), 'base64');
if (!keystore.length) throw new Error('Keystore vuoto.');
fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
fs.writeFileSync(`${dir}/google-play.json`, google, { mode: 0o600 });
fs.writeFileSync(`${dir}/upload.jks`, keystore, { mode: 0o600 });
fs.appendFileSync(required('BASH_ENV'), `\nexport GOOGLE_PLAY_JSON_KEY_PATH=${dir}/google-play.json\nexport ANDROID_KEYSTORE_PATH=${dir}/upload.jks\n`);
console.log('Credenziali temporanee predisposte.');
