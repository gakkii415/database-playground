# データベース実験室 v1

[アプリを開く](https://gakkii415.github.io/database-playground/?v=1)

架空の雑貨店の顧客・商品・注文を使い、データベースを直感的に試す日本語アプリ。

- 操作フォームから検索・追加・更新・削除。生成されるSQLも確認できます。
- SQLエディタと7つの例。JOIN、集計、未注文の顧客、主キー・外部キーの失敗例。
- 注文を選んでIDと参照先を確認。変更した行の前後比較。
- SQLiteをsql.js 1.13.0でブラウザ内実行。サーバー不要。サンプルはすべて架空。
- localStorageへ保存、10回まで取り消し、初期状態への復元。共有やクラウド同期はありません。
- 各表・結果500行、SQL1文・10,000文字、8秒で中断。DDLや接続管理は対象外。
- Jitterの配色・大きな角丸・拡散影を採用。スマホは操作とデータを縦に配置。

## 開発

Node.js 22で `npm install` → `npm test` → `npm run build`。
`dist`をHTTP配信。WorkerとWASMを同じオリジンから読み込みます。
GitHub Actionsがテストとビルドを行い、mainをGitHub Pagesに公開します。

sql.jsのライセンスは公開物のvendor/SQLJS-LICENSE.txtに同梱。SQLite APIの参照: https://sql.js.org/documentation/Database.html
ブラウザ画面QAは未実施。テストでは実際のSQLiteでCRUD・結合・集計・制約・取り消し用スナップショット・ロールバックを検証します。
