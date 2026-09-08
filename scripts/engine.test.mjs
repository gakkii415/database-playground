import test from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import {createEngine} from '../web/engine.mjs';
import {buildSQL,examples} from '../web/data.mjs';
const SQL=await initSqlJs();
test('sample data, filter, JOIN, aggregate and LEFT JOIN use real SQLite',()=>{
 const e=createEngine(SQL);assert.deepEqual(Object.values(e.tables()).map(t=>t.values.length),[8,8,12]);
 assert.equal(e.run(examples[0].sql).result[0].values.length,3);
 assert.equal(e.run(examples[2].sql).result[0].values.length,12);
 assert.equal(e.run(examples[3].sql).result[0].values[0][0],'森 なつめ');
 assert.deepEqual(e.run(examples[4].sql).result[0].values,[['野原 そら']]);e.close();
});
test('visual CRUD yields exact before/after and snapshots restore data',()=>{
 const e=createEngine(SQL),initial=e.snapshot();
 let r=e.run(buildSQL('customers','add',{name:"O'Brien",city:'京都',member:'一般'}));assert.equal(r.changes[0].type,'added');const id=r.changes[0].id;
 r=e.run(buildSQL('customers','update',{id,name:'変更した名前',city:'大阪',member:'一般'}));assert.equal(r.changes[0].before[1],"O'Brien");assert.equal(r.changes[0].after[1],'変更した名前');
 r=e.run(buildSQL('customers','delete',{id}));assert.equal(r.changes[0].type,'deleted');
 const restored=createEngine(SQL,initial);assert.deepEqual(e.tables(),restored.tables());e.close();restored.close();
});
test('foreign keys survive export; rejected operations do not partially apply',()=>{
 const e=createEngine(SQL),before=e.tables();e.snapshot();
 assert.throws(()=>e.run(examples[5].sql),/UNIQUE/);assert.throws(()=>e.run(examples[6].sql),/FOREIGN KEY/);
 assert.throws(()=>e.run('DELETE FROM customers WHERE id=1'),/FOREIGN KEY/);
 assert.throws(()=>e.run('UPDATE products SET stock=-1 WHERE id=1'),/CHECK/);
 assert.throws(()=>e.run("INSERT INTO customers(name,city,member) VALUES('x','y','z'); SELECT 1;"),/1文/);
 assert.deepEqual(e.tables(),before);e.close();
});
test('SQL limits, empty results, syntax errors and schema preservation',()=>{
 const e=createEngine(SQL);assert.equal(e.run('SELECT * FROM customers WHERE id=999').result[0].values.length,0);
 assert.throws(()=>e.run('DROP TABLE customers'),/この実験室/);
 assert.throws(()=>e.run('PRAGMA foreign_keys=OFF'),/この実験室/);
 assert.throws(()=>e.run('SELECT broken FROM customers'),/no such column/);
 assert.throws(()=>e.run('WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<501) SELECT x FROM n'),/500行/);
 assert.equal(e.run('SELECT COUNT(*) FROM customers').result[0].values[0][0],8);e.close();
});
test('input validation and quotes cannot become extra SQL',()=>{
 assert.throws(()=>buildSQL('products','add',{name:'x',category:'y',price:1.5,stock:1}),/整数/);
 const e=createEngine(SQL);e.run(buildSQL('customers','add',{name:"'; DELETE FROM customers; --",city:'京都',member:'一般'}));assert.equal(e.tables().customers.values.length,9);e.close();
});
