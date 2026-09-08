import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as engineModule from '../web/engine.mjs';
test('browser-style worker loads bundled WASM and executes queries',async()=>{
 const js=await readFile('node_modules/sql.js/dist/sql-wasm.js','utf8'),wasm=await readFile('node_modules/sql.js/dist/sql-wasm.wasm');
 const outputs=[];
 const context=vm.createContext({console,WebAssembly,Uint8Array,ArrayBuffer,TextDecoder,TextEncoder,setTimeout,clearTimeout,URL,engineModule:Promise.resolve(engineModule),location:{href:'https://example.test/worker.js'},postMessage:m=>outputs.push(m),fetch:async()=>new Response(wasm,{headers:{'Content-Type':'application/wasm'}})});
 context.self=context;context.importScripts=()=>vm.runInContext(js,context);
 const worker=(await readFile('web/worker.js','utf8')).replace("const engineModule=import('./engine.mjs');",'');
 vm.runInContext(worker,context);
 await context.onmessage({data:{id:1,type:'init'}});
 assert.equal(outputs[0].error,undefined);assert.equal(outputs[0].tables.customers.values.length,8);
 await context.onmessage({data:{id:2,type:'run',sql:'SELECT COUNT(*) AS n FROM orders'}});
 assert.equal(outputs[1].error,undefined);assert.equal(outputs[1].result[0].values[0][0],12);
});
