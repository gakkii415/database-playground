importScripts('./vendor/sql-wasm.js');
const engineModule=import('./engine.mjs');
let engine;
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){
   const SQL=await self.initSqlJs({locateFile:()=>new URL('./vendor/sql-wasm.wasm',self.location.href).href});
   engine?.close();engine=(await engineModule).createEngine(SQL,data.bytes);
   self.postMessage({id:data.id,tables:engine.tables(),bytes:engine.snapshot()});
  }else self.postMessage({id:data.id,...engine.run(data.sql)});
 }catch(e){self.postMessage({id:data.id,error:String(e.message||e)});}
};
