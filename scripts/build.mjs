import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await cp('web','dist',{recursive:true});await mkdir('dist/vendor',{recursive:true});
for(const f of ['sql-wasm.js','sql-wasm.wasm'])await cp(`node_modules/sql.js/dist/${f}`,`dist/vendor/${f}`);
await cp('node_modules/sql.js/LICENSE','dist/vendor/SQLJS-LICENSE.txt');
console.log('Built static database playground');
