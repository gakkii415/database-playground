import {seedSQL,schema} from './data.mjs';
export function createEngine(SQL,bytes){
 let db=new SQL.Database(bytes?.length?bytes:undefined);
 if(!bytes?.length)db.run(seedSQL);
 const enable=()=>db.run('PRAGMA foreign_keys = ON;');enable();
 const snapshot=()=>{const data=db.export();enable();return data;};
 const tables=()=>Object.fromEntries(Object.keys(schema).map(name=>[name,db.exec(`SELECT * FROM ${name} ORDER BY id`)[0]||{columns:Object.keys(schema[name].columns),values:[]} ]));
 function run(sql){
  if(!sql.trim())throw Error('SQLを入力してください');
  if(sql.length>10000)throw Error('SQLは10,000文字以内にしてください');
  const before=tables();let result=[];
  db.run('SAVEPOINT playground');
  try{
   let count=0;
   for(const stmt of db.iterateStatements(sql)){
    if(++count>1)throw Error('一度に実行できるSQLは1文です');
    const clean=stmt.getSQL().replace(/\/\*[\s\S]*?\*\//g,' ').replace(/--[^\n]*/g,' ').trim();
    if(!/^(SELECT|WITH|INSERT|UPDATE|DELETE|EXPLAIN)\b/i.test(clean))throw Error('この実験室ではSELECT・INSERT・UPDATE・DELETEとWITH・EXPLAINを使えます');
    const columns=stmt.getColumnNames(),values=[];
    while(stmt.step()){if(values.length>=500)throw Error('結果が500行を超えました。LIMITを追加してください');values.push(stmt.get());}
    if(columns.length)result.push({columns,values});
   }
   if(!count)throw Error('実行するSQLがありません');
   for(const t of Object.keys(schema)){if(db.exec(`SELECT COUNT(*) FROM ${t}`)[0].values[0][0]>500)throw Error('各テーブルは500行までです');}
   db.run('RELEASE playground');
  }catch(e){db.run('ROLLBACK TO playground; RELEASE playground');throw e;}
  const after=tables();const changes=[];
  for(const name of Object.keys(schema)){
   const old=new Map(before[name].values.map(r=>[r[0],r])),next=new Map(after[name].values.map(r=>[r[0],r]));
   for(const [id,row] of next){if(!old.has(id))changes.push({table:name,type:'added',id,before:null,after:row});else if(JSON.stringify(old.get(id))!==JSON.stringify(row))changes.push({table:name,type:'updated',id,before:old.get(id),after:row});}
   for(const [id,row] of old)if(!next.has(id))changes.push({table:name,type:'deleted',id,before:row,after:null});
  }
  return {tables:after,result,changes,bytes:snapshot()};
 }
 return {run,tables,snapshot,close:()=>db.close()};
}
