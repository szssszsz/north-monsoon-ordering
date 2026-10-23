import {execFileSync} from 'node:child_process';
import {copyFileSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
execFileSync(process.execPath,['scripts/compose-wind.mjs'],{stdio:'inherit'});
const vite=resolve('node_modules/vite/bin/vite.js');
execFileSync(process.execPath,[vite,'build','--mode','classic'],{stdio:'inherit'});
execFileSync(process.execPath,[vite,'build','--mode','reverie','--outDir','dist/encore','--emptyOutDir'],{stdio:'inherit'});
// Admin always uses the established backend; both independent clients share the API.
mkdirSync('dist/encore',{recursive:true});copyFileSync('public/admin.html','dist/encore/admin.html');
for(const ext of ['png','svg'])copyFileSync('public/encore-qr.'+ext,'dist/encore/ordering-qr.'+ext);
const index=readFileSync('dist/encore/index.html','utf8').replace('北境季风｜云端无界自助盛宴','北境季风｜月下回响');
writeFileSync('dist/encore/index.html',index);
console.log('Independent editions built: dist/ and dist/encore/.');
