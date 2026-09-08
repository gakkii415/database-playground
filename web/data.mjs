export const schema={
 customers:{name:'顧客',description:'誰が買った？ お客さんごとに1行。',columns:{id:'顧客ID',name:'名前',city:'地域',member:'会員区分'},types:{name:'text',city:'text',member:'text'}},
 products:{name:'商品',description:'何を売る？ 商品ごとに価格と在庫を持ちます。',columns:{id:'商品ID',name:'商品名',category:'分類',price:'価格（円）',stock:'在庫'},types:{name:'text',category:'text',price:'number',stock:'number'}},
 orders:{name:'注文',description:'誰が・何を・いくつ買った？ IDで他の表とつながります。',columns:{id:'注文ID',customer_id:'顧客ID ↗',product_id:'商品ID ↗',quantity:'個数',unit_price:'購入時単価',ordered_at:'注文日'},types:{customer_id:'number',product_id:'number',quantity:'number',unit_price:'number',ordered_at:'date'}}
};
export const seedSQL=`
CREATE TABLE customers(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL CHECK(length(trim(name))>0),city TEXT NOT NULL,member TEXT NOT NULL DEFAULT '一般');
CREATE TABLE products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL CHECK(length(trim(name))>0),category TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>=0),stock INTEGER NOT NULL CHECK(stock>=0));
CREATE TABLE orders(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL REFERENCES customers(id),product_id INTEGER NOT NULL REFERENCES products(id),quantity INTEGER NOT NULL CHECK(quantity>0),unit_price INTEGER NOT NULL CHECK(unit_price>=0),ordered_at TEXT NOT NULL);
INSERT INTO customers(name,city,member) VALUES
('青井 はる','京都','一般'),('森 なつめ','大阪','プレミアム'),('白川 りく','京都','プレミアム'),('小川 すず','奈良','一般'),('高瀬 ゆう','神戸','一般'),('月野 あお','京都','一般'),('花村 りん','大阪','プレミアム'),('野原 そら','滋賀','一般');
INSERT INTO products(name,category,price,stock) VALUES
('朝のマグカップ','食器',1800,24),('リネンのトート','バッグ',3200,8),('週末のノート','文具',650,40),('小さな花びん','インテリア',2400,5),('木のスプーン','食器',800,32),('旅のポーチ','バッグ',1600,12),('真鍮のしおり','文具',1200,18),('香りのキャンドル','インテリア',2800,6);
INSERT INTO orders(customer_id,product_id,quantity,unit_price,ordered_at) VALUES
(1,1,2,1800,'2026-09-01'),(2,2,1,3200,'2026-09-01'),(3,3,3,650,'2026-09-02'),(1,5,2,800,'2026-09-02'),(4,4,1,2400,'2026-09-03'),(5,6,2,1600,'2026-09-03'),(2,8,1,2800,'2026-09-04'),(6,1,1,1800,'2026-09-04'),(7,7,2,1200,'2026-09-05'),(3,2,1,3200,'2026-09-05'),(4,3,2,650,'2026-09-06'),(7,8,1,2800,'2026-09-07');
`;
export const examples=[
 {name:'京都のお客さん',hint:'WHEREで条件に合う行だけ取り出します。元の表は変わりません。',sql:"SELECT * FROM customers WHERE city = '京都';"},
 {name:'在庫が少ない順',hint:'ORDER BYで並び替えます。LIMITで上位3件に絞ります。',sql:'SELECT name, stock FROM products ORDER BY stock ASC LIMIT 3;'},
 {name:'注文に名前をつける',hint:'JOINでIDが一致する行をつなぎます。注文に名前を書き写す必要はありません。',sql:'SELECT o.id, c.name AS 顧客名, p.name AS 商品名, o.quantity AS 個数, o.quantity * o.unit_price AS 金額\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN products p ON o.product_id = p.id;'},
 {name:'お客さん別の購入額',hint:'GROUP BYで顧客ごとにまとめ、SUMで金額を足します。',sql:'SELECT c.name AS 顧客名, SUM(o.quantity * o.unit_price) AS 購入額\nFROM orders o JOIN customers c ON o.customer_id = c.id\nGROUP BY c.id, c.name ORDER BY 購入額 DESC;'},
 {name:'まだ注文していない人',hint:'LEFT JOINは注文のない顧客も残します。NULLは対応する値がないことを示します。',sql:'SELECT c.name AS 顧客名 FROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nWHERE o.id IS NULL;'},
 {name:'同じIDを入れると？',hint:'主キー（PRIMARY KEY）は重複できません。エラーになり、データは変わりません。',sql:"INSERT INTO customers(id, name, city, member) VALUES(1, '新しいお客さん', '京都', '一般');"},
 {name:'存在しない顧客の注文',hint:'外部キー（FOREIGN KEY）は、相手の表にあるIDだけを許します。',sql:"INSERT INTO orders(customer_id, product_id, quantity, unit_price, ordered_at) VALUES(999, 1, 1, 1800, '2026-09-08');"}
];
export const quote=v=>typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
export function buildSQL(table,action,values){
 const meta=schema[table];if(!meta)throw Error('表を選んでください');
 if(action==='search'){const column=values.column;if(!Object.hasOwn(meta.columns,column))throw Error('列が不正です');const val=values.value??'';return `SELECT * FROM ${table}`+(val===''?'':` WHERE ${column} = ${quote(val)}`)+';';}
 if(action==='delete'){if(!Number.isInteger(Number(values.id))||Number(values.id)<1)throw Error('行を選んでください');return `DELETE FROM ${table} WHERE id = ${Number(values.id)};`;}
 const entries=Object.entries(meta.types).map(([key,type])=>{let v=String(values[key]??'').trim();if(v==='')throw Error(meta.columns[key]+'を入力してください');if(type==='number'){v=Number(v);if(!Number.isSafeInteger(v)||v<0||(key==='quantity'&&v===0))throw Error(meta.columns[key]+'を正しい整数にしてください');}return [key,quote(v)];});
 if(action==='add')return `INSERT INTO ${table} (${entries.map(x=>x[0]).join(', ')})\nVALUES (${entries.map(x=>x[1]).join(', ')});`;
 if(action==='update'){if(!Number.isInteger(Number(values.id))||Number(values.id)<1)throw Error('行を選んでください');return `UPDATE ${table}\nSET ${entries.map(x=>x.join(' = ')).join(', ')}\nWHERE id = ${Number(values.id)};`;}
 throw Error('操作が不正です');
}
