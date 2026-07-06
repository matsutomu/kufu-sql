/**
 * Kufu Cloud 問題セット生成スクリプト
 * 正解SQLをフロントと同じ sql.js で実行して result_json を生成し、
 * backend/migrations/002_kufu_cloud_problems.sql を出力する。
 */
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

// ---------------------------------------------------------------
// テーブル定義（DDLは問題画面にそのまま表示されるためコメント付き）
// ---------------------------------------------------------------
const DDL = {
  customers: `CREATE TABLE customers (
  id INTEGER,             -- 企業ID
  company_name TEXT,      -- 企業名
  industry TEXT,          -- 業界
  employee_count INTEGER, -- 従業員数
  created_at TEXT         -- 契約開始日
);`,
  users: `CREATE TABLE users (
  id INTEGER,          -- ユーザーID
  customer_id INTEGER, -- 契約企業ID
  name TEXT,           -- 氏名
  email TEXT,          -- メールアドレス
  department TEXT,     -- 所属部署
  status TEXT,         -- active / inactive
  created_at TEXT      -- 登録日
);`,
  plans: `CREATE TABLE plans (
  id INTEGER,         -- プランID
  plan_name TEXT,     -- プラン名
  monthly_fee INTEGER -- 月額料金
);`,
  subscriptions: `CREATE TABLE subscriptions (
  id INTEGER,          -- 契約ID
  customer_id INTEGER, -- 契約企業ID
  plan_id INTEGER,     -- 契約プランID
  status TEXT,         -- trial / active / canceled
  started_at TEXT,     -- 契約開始日
  ended_at TEXT        -- 契約終了日（契約中はNULL）
);`,
  invoices: `CREATE TABLE invoices (
  id INTEGER,              -- 請求ID
  subscription_id INTEGER, -- 契約ID
  billing_month TEXT,      -- 請求月（YYYY-MM）
  amount INTEGER,          -- 請求金額
  paid INTEGER             -- 支払済み=1 / 未払い=0
);`,
  login_logs: `CREATE TABLE login_logs (
  id INTEGER,      -- ログID
  user_id INTEGER, -- ユーザーID
  login_at TEXT    -- ログイン日時
);`,
  products: `CREATE TABLE products (
  id INTEGER,        -- 機能ID
  product_name TEXT, -- 機能名
  category TEXT      -- カテゴリ
);`,
  feature_usage: `CREATE TABLE feature_usage (
  id INTEGER,         -- 利用履歴ID
  user_id INTEGER,    -- ユーザーID
  product_id INTEGER, -- 機能ID
  used_at TEXT        -- 利用日時
);`,
  support_tickets: `CREATE TABLE support_tickets (
  id INTEGER,          -- 問い合わせID
  customer_id INTEGER, -- 企業ID
  user_id INTEGER,     -- 問い合わせユーザーID
  category TEXT,       -- 問い合わせ種別
  status TEXT,         -- open / closed
  created_at TEXT      -- 受付日時
);`,
};

const SEED = {
  customers: [
    `INSERT INTO customers VALUES (1,'株式会社アオゾラ商事','卸売',120,'2024-04-01');`,
    `INSERT INTO customers VALUES (2,'テックフォワード株式会社','IT',45,'2024-06-15');`,
    `INSERT INTO customers VALUES (3,'株式会社みなと製作所','製造',300,'2024-09-01');`,
    `INSERT INTO customers VALUES (4,'グリーンリーフ株式会社','小売',80,'2025-01-20');`,
    `INSERT INTO customers VALUES (5,'株式会社ホシノ物流','物流',150,'2025-03-10');`,
    `INSERT INTO customers VALUES (6,'サクラ会計事務所','士業',12,'2025-05-01');`,
    `INSERT INTO customers VALUES (7,'株式会社ヤマビコ建設','建設',210,'2025-08-18');`,
    `INSERT INTO customers VALUES (8,'リバーサイド株式会社','IT',25,'2026-01-09');`,
  ],
  users: [
    `INSERT INTO users VALUES (1,1,'田島 圭介','k.tajima@aozora.example.jp','営業','active','2024-04-05');`,
    `INSERT INTO users VALUES (2,1,'森本 由紀','y.morimoto@aozora.example.jp','経理','active','2024-04-06');`,
    `INSERT INTO users VALUES (3,1,'小野 拓','t.ono@aozora.example.jp','営業','inactive','2024-05-10');`,
    `INSERT INTO users VALUES (4,2,'藤井 彩','a.fujii@techforward.example.jp','開発','active','2024-06-20');`,
    `INSERT INTO users VALUES (5,2,'中山 蓮','r.nakayama@techforward.example.jp','開発','active','2024-07-01');`,
    `INSERT INTO users VALUES (6,3,'石田 廉','r.ishida@minato.example.jp','生産管理','active','2024-09-05');`,
    `INSERT INTO users VALUES (7,3,'大森 早紀','s.omori@minato.example.jp','経理','active','2024-09-06');`,
    `INSERT INTO users VALUES (8,3,'神谷 亮','r.kamiya@minato.example.jp','営業','inactive','2025-02-14');`,
    `INSERT INTO users VALUES (9,4,'横川 芽衣','m.yokokawa@greenleaf.example.jp','人事','active','2025-01-25');`,
    `INSERT INTO users VALUES (10,5,'三浦 大地','d.miura@hoshino.example.jp','物流企画','active','2025-03-15');`,
    `INSERT INTO users VALUES (11,5,'白石 楓','k.shiraishi@hoshino.example.jp','経理','active','2025-04-01');`,
    `INSERT INTO users VALUES (12,6,'桜井 誠','m.sakurai@sakura.example.jp','会計','active','2025-05-02');`,
    `INSERT INTO users VALUES (13,7,'高村 直人','n.takamura@yamabiko.example.jp','営業','active','2025-08-20');`,
    `INSERT INTO users VALUES (14,8,'井上 千夏','c.inoue@riverside.example.jp','開発','active','2026-01-12');`,
  ],
  plans: [
    `INSERT INTO plans VALUES (1,'Free',0);`,
    `INSERT INTO plans VALUES (2,'Starter',9800);`,
    `INSERT INTO plans VALUES (3,'Business',29800);`,
    `INSERT INTO plans VALUES (4,'Enterprise',98000);`,
  ],
  subscriptions: [
    `INSERT INTO subscriptions VALUES (1,1,3,'active','2024-04-01',NULL);`,
    `INSERT INTO subscriptions VALUES (2,2,2,'active','2024-06-15',NULL);`,
    `INSERT INTO subscriptions VALUES (3,3,4,'active','2024-09-01',NULL);`,
    `INSERT INTO subscriptions VALUES (4,4,2,'canceled','2025-01-20','2025-11-30');`,
    `INSERT INTO subscriptions VALUES (5,4,3,'active','2025-12-01',NULL);`,
    `INSERT INTO subscriptions VALUES (6,5,2,'canceled','2025-03-10','2025-12-31');`,
    `INSERT INTO subscriptions VALUES (7,5,3,'active','2026-01-01',NULL);`,
    `INSERT INTO subscriptions VALUES (8,6,1,'active','2025-05-01',NULL);`,
    `INSERT INTO subscriptions VALUES (9,7,2,'canceled','2025-08-18','2026-02-28');`,
    `INSERT INTO subscriptions VALUES (10,8,2,'trial','2026-01-09',NULL);`,
  ],
  invoices: [
    `INSERT INTO invoices VALUES (1,1,'2026-04',29800,1);`,
    `INSERT INTO invoices VALUES (2,1,'2026-05',29800,1);`,
    `INSERT INTO invoices VALUES (3,1,'2026-06',29800,0);`,
    `INSERT INTO invoices VALUES (4,2,'2026-05',9800,1);`,
    `INSERT INTO invoices VALUES (5,2,'2026-06',9800,1);`,
    `INSERT INTO invoices VALUES (6,3,'2026-04',98000,1);`,
    `INSERT INTO invoices VALUES (7,3,'2026-05',98000,1);`,
    `INSERT INTO invoices VALUES (8,3,'2026-06',98000,0);`,
    `INSERT INTO invoices VALUES (9,5,'2026-05',29800,1);`,
    `INSERT INTO invoices VALUES (10,5,'2026-06',29800,1);`,
    `INSERT INTO invoices VALUES (11,7,'2026-06',29800,0);`,
  ],
  login_logs: [
    `INSERT INTO login_logs VALUES (1,1,'2026-06-29 09:12:00');`,
    `INSERT INTO login_logs VALUES (2,1,'2026-07-01 08:55:00');`,
    `INSERT INTO login_logs VALUES (3,1,'2026-07-03 09:02:00');`,
    `INSERT INTO login_logs VALUES (4,2,'2026-07-01 10:30:00');`,
    `INSERT INTO login_logs VALUES (5,4,'2026-06-30 13:45:00');`,
    `INSERT INTO login_logs VALUES (6,4,'2026-07-02 14:10:00');`,
    `INSERT INTO login_logs VALUES (7,5,'2026-07-02 09:20:00');`,
    `INSERT INTO login_logs VALUES (8,6,'2026-06-28 08:40:00');`,
    `INSERT INTO login_logs VALUES (9,6,'2026-07-03 08:35:00');`,
    `INSERT INTO login_logs VALUES (10,7,'2026-07-01 11:05:00');`,
    `INSERT INTO login_logs VALUES (11,9,'2026-06-27 16:20:00');`,
    `INSERT INTO login_logs VALUES (12,12,'2026-07-02 10:00:00');`,
    `INSERT INTO login_logs VALUES (13,12,'2026-07-03 10:15:00');`,
    `INSERT INTO login_logs VALUES (14,13,'2026-06-30 09:50:00');`,
    `INSERT INTO login_logs VALUES (15,14,'2026-07-03 12:30:00');`,
  ],
  products: [
    `INSERT INTO products VALUES (1,'タスク管理','業務効率化');`,
    `INSERT INTO products VALUES (2,'ワークフロー','業務効率化');`,
    `INSERT INTO products VALUES (3,'ダッシュボード','分析');`,
    `INSERT INTO products VALUES (4,'レポート','分析');`,
    `INSERT INTO products VALUES (5,'勤怠管理','労務');`,
  ],
  feature_usage: [
    `INSERT INTO feature_usage VALUES (1,1,1,'2026-06-29 09:20:00');`,
    `INSERT INTO feature_usage VALUES (2,1,1,'2026-07-01 09:00:00');`,
    `INSERT INTO feature_usage VALUES (3,2,1,'2026-07-01 10:40:00');`,
    `INSERT INTO feature_usage VALUES (4,5,1,'2026-07-02 09:30:00');`,
    `INSERT INTO feature_usage VALUES (5,6,1,'2026-06-28 08:50:00');`,
    `INSERT INTO feature_usage VALUES (6,13,1,'2026-06-30 10:00:00');`,
    `INSERT INTO feature_usage VALUES (7,1,3,'2026-07-03 09:10:00');`,
    `INSERT INTO feature_usage VALUES (8,4,3,'2026-07-02 14:20:00');`,
    `INSERT INTO feature_usage VALUES (9,12,3,'2026-07-02 10:05:00');`,
    `INSERT INTO feature_usage VALUES (10,14,3,'2026-07-03 12:40:00');`,
    `INSERT INTO feature_usage VALUES (11,2,4,'2026-07-01 10:50:00');`,
    `INSERT INTO feature_usage VALUES (12,7,4,'2026-07-01 11:15:00');`,
    `INSERT INTO feature_usage VALUES (13,9,4,'2026-06-27 16:30:00');`,
    `INSERT INTO feature_usage VALUES (14,6,2,'2026-07-03 08:45:00');`,
    `INSERT INTO feature_usage VALUES (15,7,2,'2026-07-01 11:20:00');`,
    `INSERT INTO feature_usage VALUES (16,12,5,'2026-07-03 10:20:00');`,
  ],
  support_tickets: [
    `INSERT INTO support_tickets VALUES (1,1,2,'請求','closed','2026-05-12 14:00:00');`,
    `INSERT INTO support_tickets VALUES (2,2,4,'不具合','open','2026-06-20 09:30:00');`,
    `INSERT INTO support_tickets VALUES (3,3,7,'操作方法','closed','2026-04-03 11:00:00');`,
    `INSERT INTO support_tickets VALUES (4,3,6,'要望','open','2026-06-28 15:10:00');`,
    `INSERT INTO support_tickets VALUES (5,4,9,'操作方法','closed','2026-03-15 10:20:00');`,
    `INSERT INTO support_tickets VALUES (6,5,11,'請求','open','2026-07-01 13:40:00');`,
    `INSERT INTO support_tickets VALUES (7,6,12,'不具合','closed','2026-05-30 16:00:00');`,
    `INSERT INTO support_tickets VALUES (8,1,1,'操作方法','open','2026-06-25 09:00:00');`,
  ],
};

const CATEGORIES = [
  { id: 1, name: "SQL基礎", desc: "SELECT・WHERE・ORDER BY・LIMIT ── 営業部・経理部 編" },
  { id: 2, name: "集計", desc: "COUNT・SUM・AVG・GROUP BY・HAVING ── マーケティング部・カスタマーサクセス 編" },
  { id: 3, name: "JOIN", desc: "テーブル結合 ── 営業企画・プロダクトマネージャー 編" },
  { id: 4, name: "分析", desc: "サブクエリ・CASE・CTE・UNION ── 経営企画・データ分析チーム 編" },
  { id: 5, name: "PostgreSQL実践", desc: "Window関数・FILTER・JSON ── 開発部・SRE・データエンジニア 編" },
];

// ---------------------------------------------------------------
// 問題定義（id = Lv番号）
// ---------------------------------------------------------------
const P = [];
const add = (id, cat, diff, title, desc, hint, tables, sql) =>
  P.push({ id, cat, diff, title, desc, hint, tables, sql });

// ===== Lv.1〜10 SQL基礎（営業部・経理部）=====
add(1, 1, "easy", "Lv.1 はじめての顧客リスト",
  "Kufu Cloudへようこそ！あなたは今日入社した新人データアナリストです。最初の配属先は営業部。先輩から「まずはうちの契約企業のデータを一度全部見てみて」と声をかけられました。customersに登録されている全ての行・全てのカラムを取得して、どんな企業がKufu Cloudを使ってくれているのか確認しましょう。",
  "SELECT * FROM テーブル名 で全カラムを取得できます",
  ["customers"],
  `SELECT * FROM customers`);

add(2, 1, "easy", "Lv.2 企業名と業界だけの一覧",
  "営業部から「営業会議の資料に載せたいので、企業名と業界だけのシンプルな一覧がほしい」と依頼されました。余計な情報は不要とのこと。customersからcompany_name（企業名）とindustry（業界）の2つだけを取得してください。",
  "SELECT カラム名, カラム名 FROM ... のように必要なカラムだけを指定します",
  ["customers"],
  `SELECT company_name, industry FROM customers`);

add(3, 1, "easy", "Lv.3 IT業界の企業を探す",
  "営業部で「IT業界向けの新機能キャンペーンをやるので、対象になる契約企業を教えてほしい」という話が出ました。industryが「IT」の企業を全カラムで取得してください。",
  "WHERE industry = 'IT' のように条件を指定します",
  ["customers"],
  `SELECT * FROM customers WHERE industry = 'IT'`);

add(4, 1, "easy", "Lv.4 大口顧客の候補を絞り込む",
  "営業部のマネージャーから「アップセルの提案先として、従業員数が100名以上の企業をリストアップしてほしい」と頼まれました。employee_countが100以上の企業を全カラムで取得してください。",
  "数値の比較には >= などの比較演算子が使えます",
  ["customers"],
  `SELECT * FROM customers WHERE employee_count >= 100`);

add(5, 1, "easy", "Lv.5 請求書の宛名チェック",
  "今度は経理部からの依頼です。「請求書の宛名を確認したいので、社名が『株式会社』で始まる企業の企業名を並べてほしい」とのこと。company_nameが「株式会社」で始まる企業のcompany_nameを、id順に取得してください。",
  "前方一致は LIKE '株式会社%' のように % を使います",
  ["customers"],
  `SELECT company_name FROM customers WHERE company_name LIKE '株式会社%' ORDER BY id`);

add(6, 1, "easy", "Lv.6 新しい契約から順に並べる",
  "営業部から「最近契約してくれた企業からフォローの電話をかけたい。契約開始日が新しい順の一覧がほしい」と依頼がありました。company_nameとcreated_atを、created_at（契約開始日）の降順で取得してください。",
  "ORDER BY カラム名 DESC で降順に並びます",
  ["customers"],
  `SELECT company_name, created_at FROM customers ORDER BY created_at DESC`);

add(7, 1, "easy", "Lv.7 料金プランを安い順に",
  "経理部から「お客様への提案資料用に、料金プランを安い順に整理してほしい」と頼まれました。plansからplan_nameとmonthly_feeを、monthly_fee（月額料金）の昇順で取得してください。",
  "ORDER BY カラム名 ASC（ASCは省略可能）で昇順に並びます",
  ["plans"],
  `SELECT plan_name, monthly_fee FROM plans ORDER BY monthly_fee ASC`);

add(8, 1, "easy", "Lv.8 従業員数トップ3の企業",
  "営業部の週次ミーティングで「うちの顧客で一番大きい会社ってどこだっけ？」という話題に。company_nameとemployee_countを従業員数の多い順に並べ、上位3社だけを取得してください。",
  "ORDER BY ... DESC と LIMIT 3 を組み合わせます",
  ["customers"],
  `SELECT company_name, employee_count FROM customers ORDER BY employee_count DESC LIMIT 3`);

add(9, 1, "easy", "Lv.9 条件を組み合わせて絞り込む",
  "営業部から「小規模なIT企業向けの導入支援プログラムを始めるので、対象企業を洗い出してほしい」と依頼されました。industryが「IT」かつemployee_countが50未満の企業について、company_nameとemployee_countをid順に取得してください。",
  "複数の条件は AND でつなげます",
  ["customers"],
  `SELECT company_name, employee_count FROM customers WHERE industry = 'IT' AND employee_count < 50 ORDER BY id`);

add(10, 1, "easy", "Lv.10 一番安い有料プランはどれ？",
  "経理部から「無料プランを除いて、一番安い有料プランを確認したい」と質問が来ました。monthly_feeが0より大きいプランの中から、plan_nameとmonthly_feeを料金の安い順に並べて、先頭の1件だけを取得してください。",
  "WHERE・ORDER BY・LIMIT を全部組み合わせる総仕上げです",
  ["plans"],
  `SELECT plan_name, monthly_fee FROM plans WHERE monthly_fee > 0 ORDER BY monthly_fee ASC LIMIT 1`);

// ===== Lv.11〜20 集計（マーケティング部・カスタマーサクセス）=====
add(11, 2, "easy", "Lv.11 契約企業数を数える",
  "基礎研修を終えたあなたは、マーケティング部に異動しました。早速「プレスリリースに載せる契約企業数を確認してほしい」と依頼が。customersの全件数を集計してください。",
  "COUNT(*) で行数を数えられます",
  ["customers"],
  `SELECT COUNT(*) FROM customers`);

add(12, 2, "easy", "Lv.12 アクティブユーザー数を数える",
  "カスタマーサクセスから「利用状況レポートに載せるので、現在アクティブなユーザー数を教えてほしい」と依頼されました。usersのうちstatusが「active」のユーザー数を集計してください。",
  "COUNT(*) と WHERE を組み合わせます",
  ["users"],
  `SELECT COUNT(*) FROM users WHERE status = 'active'`);

add(13, 2, "easy", "Lv.13 今月の請求総額",
  "マーケティング部の月次報告会に向けて「2026年6月分の請求額の合計を出してほしい」と頼まれました。invoicesのうちbilling_monthが「2026-06」の請求について、amountの合計をtotal_amountという名前で取得してください。",
  "SUM(カラム名) で合計、AS で結果のカラムに名前を付けられます",
  ["invoices"],
  `SELECT SUM(amount) AS total_amount FROM invoices WHERE billing_month = '2026-06'`);

add(14, 2, "easy", "Lv.14 顧客企業の平均規模",
  "マーケティング部から「うちのサービスはどのくらいの規模の会社に使われているのか、平均従業員数を知りたい」とのこと。customersのemployee_countの平均をavg_employeesという名前で集計してください。",
  "AVG(カラム名) で平均を計算できます",
  ["customers"],
  `SELECT AVG(employee_count) AS avg_employees FROM customers`);

add(15, 2, "easy", "Lv.15 最大の企業と最小の企業",
  "続けてマーケティング部から「顧客の規模の幅も知りたい。一番大きい従業員数と一番小さい従業員数を並べてほしい」と依頼されました。employee_countの最大値をmax_employees、最小値をmin_employeesとして1つのSQLで取得してください。",
  "MAX() と MIN() は同じSELECTの中で一緒に使えます",
  ["customers"],
  `SELECT MAX(employee_count) AS max_employees, MIN(employee_count) AS min_employees FROM customers`);

add(16, 2, "medium", "Lv.16 業界別の企業数",
  "マーケティング部が業界別の攻略戦略を立てることになりました。「業界ごとに契約企業が何社あるか集計してほしい」との依頼です。industryごとの企業数をcompany_countという名前で集計し、業界名の昇順で表示してください。",
  "GROUP BY industry でグループ化し、COUNT(*) で数えます",
  ["customers"],
  `SELECT industry, COUNT(*) AS company_count FROM customers GROUP BY industry ORDER BY industry`);

add(17, 2, "medium", "Lv.17 どんな部署に使われている？",
  "カスタマーサクセスから「利用ユーザーはどんな部署の人が多いのか、部署別の人数を出してほしい」と依頼されました。usersをdepartmentごとにグループ化してユーザー数をuser_countとして集計し、部署名の昇順で表示してください。",
  "GROUP BY department と COUNT(*) を組み合わせます",
  ["users"],
  `SELECT department, COUNT(*) AS user_count FROM users GROUP BY department ORDER BY department`);

add(18, 2, "medium", "Lv.18 月別の請求額推移",
  "マーケティング部の売上ダッシュボード作りを手伝うことになりました。まずは「月ごとの請求額の合計」が必要です。invoicesをbilling_monthごとにグループ化してamountの合計をtotal_amountとして集計し、請求月の昇順で表示してください。",
  "GROUP BY billing_month でグループ化します",
  ["invoices"],
  `SELECT billing_month, SUM(amount) AS total_amount FROM invoices GROUP BY billing_month ORDER BY billing_month`);

add(19, 2, "medium", "Lv.19 問い合わせの多い企業を見つける",
  "カスタマーサクセスから「サポートへの問い合わせが特に多い企業を重点フォローしたい。2件以上問い合わせている企業を抽出してほしい」と依頼されました。support_ticketsをcustomer_idごとに集計し、問い合わせ件数（ticket_count）が2件以上の企業だけをcustomer_idの昇順で表示してください。",
  "グループ化した後の絞り込みは WHERE ではなく HAVING を使います",
  ["support_tickets"],
  `SELECT customer_id, COUNT(*) AS ticket_count FROM support_tickets GROUP BY customer_id HAVING COUNT(*) >= 2 ORDER BY customer_id`);

add(20, 2, "medium", "Lv.20 実際にログインした人数",
  "カスタマーサクセスの定例会で「ログイン履歴は件数じゃなくて、実際に何人がログインしたかが知りたい」という指摘がありました。login_logsから、重複を除いたユーザー数をlogin_usersという名前で集計してください。",
  "COUNT(DISTINCT user_id) で重複を除いて数えられます",
  ["login_logs"],
  `SELECT COUNT(DISTINCT user_id) AS login_users FROM login_logs`);

// ===== Lv.21〜35 JOIN（営業企画・プロダクトマネージャー）=====
add(21, 3, "medium", "Lv.21 ユーザーと所属企業をつなげる",
  "集計業務で実力を認められ、営業企画に異動しました。ここからはテーブルを組み合わせる仕事が増えます。まずは「利用ユーザーの一覧に、どこの会社の人か分かるように企業名を付けてほしい」との依頼。usersとcustomersを結合して、ユーザーID・氏名・企業名をユーザーIDの昇順で取得してください。",
  "INNER JOIN customers ON users.customer_id = customers.id のように結合します",
  ["users", "customers"],
  `SELECT u.id, u.name, c.company_name
FROM users u
INNER JOIN customers c ON u.customer_id = c.id
ORDER BY u.id`);

add(22, 3, "medium", "Lv.22 契約一覧にプラン名を付ける",
  "営業企画から「契約の一覧って、plan_idの数字だけじゃ分からないんだよね。プラン名で見たい」と言われました。subscriptionsとplansを結合して、契約ID・プラン名・契約ステータスを契約IDの昇順で取得してください。",
  "subscriptions.plan_id と plans.id を結合キーにします",
  ["subscriptions", "plans"],
  `SELECT s.id, p.plan_name, s.status
FROM subscriptions s
INNER JOIN plans p ON s.plan_id = p.id
ORDER BY s.id`);

add(23, 3, "medium", "Lv.23 契約中の企業とプランの一覧",
  "営業企画の月次資料に「現在契約中の企業とそのプラン」の一覧が必要になりました。subscriptions・customers・plansの3テーブルを結合し、statusが「active」の契約について企業名とプラン名を取得してください。企業名の昇順で表示します。",
  "JOINは2回続けて書けます。3テーブル結合に挑戦しましょう",
  ["subscriptions", "customers", "plans"],
  `SELECT c.company_name, p.plan_name
FROM subscriptions s
INNER JOIN customers c ON s.customer_id = c.id
INNER JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY c.company_name`);

add(24, 3, "medium", "Lv.24 Businessプランの契約企業",
  "営業部から営業企画経由で「契約中のBusinessプラン企業一覧を提出してください」という依頼が届きました。契約中（status='active'）でプラン名が「Business」の企業名を、昇順で取得してください。",
  "JOINした上で WHERE に複数条件を指定します",
  ["subscriptions", "customers", "plans"],
  `SELECT c.company_name
FROM subscriptions s
INNER JOIN customers c ON s.customer_id = c.id
INNER JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active' AND p.plan_name = 'Business'
ORDER BY c.company_name`);

add(25, 3, "medium", "Lv.25 一度も問い合わせのない企業",
  "プロダクトマネージャーから「一度もサポートに問い合わせていない企業は、逆に使いこなせていない可能性がある。リストアップしてほしい」と相談されました。customersとsupport_ticketsをLEFT JOINで結合し、問い合わせが1件もない企業の企業名を昇順で取得してください。",
  "LEFT JOIN して、結合相手のカラムが IS NULL の行を探します",
  ["customers", "support_tickets"],
  `SELECT c.company_name
FROM customers c
LEFT JOIN support_tickets t ON c.id = t.customer_id
WHERE t.id IS NULL
ORDER BY c.company_name`);

add(26, 3, "medium", "Lv.26 企業別の問い合わせ件数（ゼロ件も含む）",
  "カスタマーサクセスの資料で「問い合わせ件数の一覧に、0件の企業も載せたい」というリクエストがありました。customersとsupport_ticketsをLEFT JOINで結合し、企業ごとの問い合わせ件数をticket_countとして集計してください。0件の企業も表示し、企業名の昇順で並べます。",
  "COUNT(t.id) にすると、結合できなかった行（NULL）は数えられず0になります",
  ["customers", "support_tickets"],
  `SELECT c.company_name, COUNT(t.id) AS ticket_count
FROM customers c
LEFT JOIN support_tickets t ON c.id = t.customer_id
GROUP BY c.company_name
ORDER BY c.company_name`);

add(27, 3, "medium", "Lv.27 直近のログイン5件",
  "プロダクトマネージャーから「今朝の障害の影響を確認したい。直近のログイン5件を、誰がログインしたか分かる形で見せてほしい」と頼まれました。login_logsとusersを結合し、氏名とログイン日時を新しい順に5件取得してください。",
  "JOINした結果にも ORDER BY と LIMIT が使えます",
  ["login_logs", "users"],
  `SELECT u.name, l.login_at
FROM login_logs l
INNER JOIN users u ON l.user_id = u.id
ORDER BY l.login_at DESC
LIMIT 5`);

add(28, 3, "medium", "Lv.28 人気機能ランキング",
  "プロダクトマネージャーから「次の開発優先度を決めたいので、どの機能がよく使われているかランキングにしてほしい」と依頼されました。feature_usageとproductsを結合し、機能名ごとの利用回数をusage_countとして集計して、利用回数の多い順に表示してください。",
  "JOIN・GROUP BY・ORDER BY の組み合わせです",
  ["feature_usage", "products"],
  `SELECT p.product_name, COUNT(*) AS usage_count
FROM feature_usage f
INNER JOIN products p ON f.product_id = p.id
GROUP BY p.product_name
ORDER BY usage_count DESC`);

add(29, 3, "medium", "Lv.29 今月の請求書に企業名を付ける",
  "経理部から営業企画経由で「2026年6月分の請求一覧を、企業名入りでほしい」と依頼が来ました。invoices・subscriptions・customersの3テーブルを結合し、billing_monthが「2026-06」の請求について企業名・請求金額・支払状況（paid）を企業名の昇順で取得してください。",
  "invoices → subscriptions → customers の順にたどって結合します",
  ["invoices", "subscriptions", "customers"],
  `SELECT c.company_name, i.amount, i.paid
FROM invoices i
INNER JOIN subscriptions s ON i.subscription_id = s.id
INNER JOIN customers c ON s.customer_id = c.id
WHERE i.billing_month = '2026-06'
ORDER BY c.company_name`);

add(30, 3, "medium", "Lv.30 未払い請求のリマインドリスト",
  "経理部から「支払いがまだ確認できていない請求のリマインドをしたい。未払いの請求を企業名付きで一覧にしてほしい」と依頼されました。paidが0（未払い）の請求について、企業名・請求月・請求金額を企業名の昇順で取得してください。",
  "WHERE i.paid = 0 で未払いに絞り込めます",
  ["invoices", "subscriptions", "customers"],
  `SELECT c.company_name, i.billing_month, i.amount
FROM invoices i
INNER JOIN subscriptions s ON i.subscription_id = s.id
INNER JOIN customers c ON s.customer_id = c.id
WHERE i.paid = 0
ORDER BY c.company_name`);

add(31, 3, "medium", "Lv.31 プラン別の顧客規模",
  "営業企画から「プランごとに、契約企業の平均従業員数を比べたい。プランと会社規模の関係が知りたいんだ」と依頼されました。契約中（status='active'）の契約について、プラン名ごとにemployee_countの平均を小数第1位で丸めてavg_employeesとして集計し、プラン名の昇順で表示してください。",
  "ROUND(AVG(...), 1) で小数第1位に丸められます",
  ["subscriptions", "customers", "plans"],
  `SELECT p.plan_name, ROUND(AVG(c.employee_count), 1) AS avg_employees
FROM subscriptions s
INNER JOIN customers c ON s.customer_id = c.id
INNER JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
GROUP BY p.plan_name
ORDER BY p.plan_name`);

add(32, 3, "medium", "Lv.32 一度もログインしていないユーザー",
  "カスタマーサクセスから「登録したのに一度もログインしていないユーザーには、活用セミナーの案内を送りたい」と相談されました。usersとlogin_logsをLEFT JOINで結合し、ログイン履歴が1件もないユーザーのIDと氏名をID順に取得してください。",
  "LEFT JOIN と IS NULL の組み合わせを思い出しましょう",
  ["users", "login_logs"],
  `SELECT u.id, u.name
FROM users u
LEFT JOIN login_logs l ON u.id = l.user_id
WHERE l.id IS NULL
ORDER BY u.id`);

add(33, 3, "medium", "Lv.33 ダッシュボード機能のユーザーは誰？",
  "プロダクトマネージャーから「ダッシュボード機能のユーザーインタビューをしたい。使ったことのある人の名前を重複なしで教えてほしい」と依頼が来ました。feature_usage・users・productsを結合し、product_nameが「ダッシュボード」の利用者の氏名を重複を除いて昇順で取得してください。",
  "SELECT DISTINCT で重複を除きます",
  ["feature_usage", "users", "products"],
  `SELECT DISTINCT u.name
FROM feature_usage f
INNER JOIN users u ON f.user_id = u.id
INNER JOIN products p ON f.product_id = p.id
WHERE p.product_name = 'ダッシュボード'
ORDER BY u.name`);

add(34, 3, "medium", "Lv.34 解約された契約を振り返る",
  "営業企画で解約対策プロジェクトが始まりました。まずは「これまでに解約された契約の一覧を、企業名・プラン名・解約日付きでまとめてほしい」とのこと。statusが「canceled」の契約について3テーブルを結合し、解約日（ended_at）の早い順に取得してください。",
  "解約日順の並び替えは ORDER BY s.ended_at です",
  ["subscriptions", "customers", "plans"],
  `SELECT c.company_name, p.plan_name, s.ended_at
FROM subscriptions s
INNER JOIN customers c ON s.customer_id = c.id
INNER JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'canceled'
ORDER BY s.ended_at`);

add(35, 3, "hard", "Lv.35 企業別アクティブユーザー数",
  "JOIN編の卒業課題です。営業企画から「企業ごとのアクティブユーザー数の一覧がほしい。アクティブが0人の企業も必ず載せて」と依頼されました。customersとusersをLEFT JOINで結合し（結合条件にstatus='active'を含めます）、企業ごとのアクティブユーザー数をactive_usersとして集計してください。人数の多い順、同数なら企業名の昇順で表示します。",
  "ON c.id = u.customer_id AND u.status = 'active' のように、結合条件に絞り込みを書くのがコツです",
  ["customers", "users"],
  `SELECT c.company_name, COUNT(u.id) AS active_users
FROM customers c
LEFT JOIN users u ON c.id = u.customer_id AND u.status = 'active'
GROUP BY c.company_name
ORDER BY active_users DESC, c.company_name`);

// ===== Lv.36〜50 分析（経営企画・データ分析チーム）=====
add(36, 4, "medium", "Lv.36 平均より大きい企業はどこ？",
  "実績を積んだあなたは、ついに経営企画室へ。役員から「うちの顧客の中で、平均的な規模より大きい企業を知りたい」と質問されました。従業員数が全企業の平均以上の企業について、企業名と従業員数を従業員数の多い順に取得してください。平均値はSQLの中でサブクエリとして計算します。",
  "WHERE employee_count >= (SELECT AVG(employee_count) FROM customers) のように書きます",
  ["customers"],
  `SELECT company_name, employee_count
FROM customers
WHERE employee_count >= (SELECT AVG(employee_count) FROM customers)
ORDER BY employee_count DESC`);

add(37, 4, "medium", "Lv.37 サポートを利用したことのある企業",
  "経営企画室から「サポート体制の投資判断のため、これまでに一度でも問い合わせをしたことがある企業の一覧がほしい」と依頼されました。support_ticketsに登場する企業をINを使ったサブクエリで特定し、企業名を昇順で取得してください。",
  "WHERE id IN (SELECT customer_id FROM support_tickets) の形です",
  ["customers", "support_tickets"],
  `SELECT company_name
FROM customers
WHERE id IN (SELECT customer_id FROM support_tickets)
ORDER BY company_name`);

add(38, 4, "medium", "Lv.38 未ログインユーザーをサブクエリで",
  "データ分析チームのレビューで「Lv.32で作った未ログインユーザーのリスト、サブクエリでも書けるよ」と教わりました。今度はNOT INを使って、ログイン履歴が1件もないユーザーのIDと氏名をID順に取得してください。同じ結果を別の書き方で出せるのも、アナリストの引き出しです。",
  "WHERE id NOT IN (SELECT user_id FROM login_logs) と書きます",
  ["users", "login_logs"],
  `SELECT id, name
FROM users
WHERE id NOT IN (SELECT user_id FROM login_logs)
ORDER BY id`);

add(39, 4, "medium", "Lv.39 企業規模でラベルを付ける",
  "経営企画室の資料で、企業を規模別に分類することになりました。従業員数が200以上なら「大規模」、50以上なら「中規模」、それ未満なら「小規模」というラベルをcompany_sizeという列で付けて、企業名とあわせてid順に表示してください。",
  "CASE WHEN ... THEN ... WHEN ... THEN ... ELSE ... END を使います",
  ["customers"],
  `SELECT company_name,
  CASE
    WHEN employee_count >= 200 THEN '大規模'
    WHEN employee_count >= 50 THEN '中規模'
    ELSE '小規模'
  END AS company_size
FROM customers
ORDER BY id`);

add(40, 4, "medium", "Lv.40 支払状況をひと目でわかる形に",
  "経理部との定例で「請求全体のうち、支払済みが何件・未払いが何件かを1行で見たい」と言われました。CASE式とSUMを組み合わせて、支払済み件数をpaid_count、未払い件数をunpaid_countとして1つのSQLで集計してください。",
  "SUM(CASE WHEN paid = 1 THEN 1 ELSE 0 END) というパターンは実務で頻出です",
  ["invoices"],
  `SELECT
  SUM(CASE WHEN paid = 1 THEN 1 ELSE 0 END) AS paid_count,
  SUM(CASE WHEN paid = 0 THEN 1 ELSE 0 END) AS unpaid_count
FROM invoices`);

add(41, 4, "hard", "Lv.41 MRRを算出する",
  "いよいよSaaSビジネスの最重要指標、MRR（月間経常収益）の集計です。経営企画室から「現在契約中のプランの月額料金を合計して、今のMRRを出してほしい」と依頼されました。契約中（status='active'）の契約とplansを結合し、monthly_feeの合計をmrrという名前で取得してください。",
  "activeな契約だけを対象に SUM(p.monthly_fee) を計算します",
  ["subscriptions", "plans"],
  `SELECT SUM(p.monthly_fee) AS mrr
FROM subscriptions s
INNER JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'`);

add(42, 4, "hard", "Lv.42 1社あたりの平均ユーザー数",
  "経営企画室から「1つの契約企業あたり、平均で何人がユーザー登録しているのか知りたい」と依頼されました。まず企業ごとのユーザー数をサブクエリで集計し、その結果の平均をavg_usersとして取得してください。FROM句にサブクエリを書く練習です。",
  "FROM (SELECT customer_id, COUNT(*) AS user_count FROM users GROUP BY customer_id) AS t の形です",
  ["users"],
  `SELECT AVG(user_count) AS avg_users
FROM (SELECT customer_id, COUNT(*) AS user_count FROM users GROUP BY customer_id) AS t`);

add(43, 4, "hard", "Lv.43 CTEで月次売上を整理する",
  "データ分析チームから「複雑な集計はWITH句（CTE）で整理すると読みやすいよ」とアドバイスをもらいました。月ごとの請求額合計をmonthly_salesというCTEにまとめ、そこから請求月と合計額（total）を請求月の昇順で取得してください。結果はLv.18と同じでも、書き方の幅が広がります。",
  "WITH monthly_sales AS (SELECT ...) SELECT ... FROM monthly_sales の形です",
  ["invoices"],
  `WITH monthly_sales AS (
  SELECT billing_month, SUM(amount) AS total
  FROM invoices
  GROUP BY billing_month
)
SELECT billing_month, total
FROM monthly_sales
ORDER BY billing_month`);

add(44, 4, "hard", "Lv.44 問い合わせ件数レポート",
  "経営企画室の月次レポートに「問い合わせ件数の多い企業ランキング（企業名入り）」を載せることになりました。企業ごとの問い合わせ件数をticket_countsというCTEで集計し、customersと結合して企業名と件数を取得してください。件数の多い順、同数なら企業名の昇順で表示します。",
  "CTEの結果は普通のテーブルのようにJOINできます",
  ["support_tickets", "customers"],
  `WITH ticket_counts AS (
  SELECT customer_id, COUNT(*) AS ticket_count
  FROM support_tickets
  GROUP BY customer_id
)
SELECT c.company_name, t.ticket_count
FROM ticket_counts t
INNER JOIN customers c ON t.customer_id = c.id
ORDER BY t.ticket_count DESC, c.company_name`);

add(45, 4, "hard", "Lv.45 重点アプローチ先リスト",
  "経営企画室から「来期の重点アプローチ先として『IT業界の企業』と『従業員200名以上の企業』を1つのリストにまとめてほしい。両方に当てはまる企業が重複しないように」と依頼されました。2つのSELECTをUNIONでつなぎ、企業名を昇順で取得してください。",
  "UNION は重複を自動的に取り除きます（UNION ALL との違いも調べてみましょう）",
  ["customers"],
  `SELECT company_name FROM customers WHERE industry = 'IT'
UNION
SELECT company_name FROM customers WHERE employee_count >= 200
ORDER BY company_name`);

add(46, 4, "hard", "Lv.46 解約率を計算する",
  "役員会議で「うちの解約率って何％？」という質問が飛びました。経営企画室から急ぎの依頼です。subscriptionsのうちstatusが「canceled」の割合をパーセントで計算し、小数第1位に丸めてchurn_rateという名前で取得してください。",
  "100.0 を掛けてから割ると小数の計算になります。CASE式で解約件数を数えましょう",
  ["subscriptions"],
  `SELECT ROUND(100.0 * SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) / COUNT(*), 1) AS churn_rate
FROM subscriptions`);

add(47, 4, "hard", "Lv.47 未払いのある企業を洗い出す",
  "経理部から「未払い請求が1件でもある企業の一覧がほしい。督促の優先度を決めたい」と依頼されました。EXISTSを使ったサブクエリで、未払い（paid=0）の請求を持つ企業の企業名を昇順で取得してください。",
  "WHERE EXISTS (SELECT 1 FROM ... WHERE s.customer_id = c.id AND ...) の相関サブクエリです",
  ["customers", "subscriptions", "invoices"],
  `SELECT company_name
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM subscriptions s
  INNER JOIN invoices i ON s.id = i.subscription_id
  WHERE s.customer_id = c.id AND i.paid = 0
)
ORDER BY company_name`);

add(48, 4, "hard", "Lv.48 月別の新規契約数",
  "経営企画室から「事業の成長を見たいので、契約開始月ごとの新規契約数を時系列で出してほしい」と依頼されました。started_atから「YYYY-MM」形式の月をstart_monthとして取り出し、月ごとの契約数をnew_contractsとして集計して、月の昇順で表示してください。",
  "SQLiteでは strftime('%Y-%m', started_at) で年月を取り出せます（PostgreSQLでは to_char）",
  ["subscriptions"],
  `SELECT strftime('%Y-%m', started_at) AS start_month, COUNT(*) AS new_contracts
FROM subscriptions
GROUP BY start_month
ORDER BY start_month`);

add(49, 4, "hard", "Lv.49 プラン別MRRレポート",
  "経営企画室のMRR分析を深掘りします。「プランごとの契約数とMRRを、MRRの大きい順に並べたレポートがほしい」との依頼です。契約中の契約をactive_subsというCTEにまとめ、plansと結合してプラン名・契約数（contracts）・MRR（mrr）を集計してください。",
  "CTE・JOIN・GROUP BYの総合演習です。SUM(p.monthly_fee) がプラン別MRRになります",
  ["subscriptions", "plans"],
  `WITH active_subs AS (
  SELECT plan_id FROM subscriptions WHERE status = 'active'
)
SELECT p.plan_name, COUNT(*) AS contracts, SUM(p.monthly_fee) AS mrr
FROM active_subs a
INNER JOIN plans p ON a.plan_id = p.id
GROUP BY p.plan_name
ORDER BY mrr DESC`);

add(50, 4, "hard", "Lv.50 全プランの契約状況一覧",
  "分析編の卒業課題です。経営企画室から「全プランについて、契約中の件数を一覧にしてほしい。契約が0件のプランも必ず載せること」と依頼されました。SELECT句の中にサブクエリを書いて、プランごとの契約中件数をactive_contractsとして取得し、プランIDの昇順で表示してください。",
  "SELECT句に (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND ...) と書くスカラーサブクエリです",
  ["plans", "subscriptions"],
  `SELECT p.plan_name,
  (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.status = 'active') AS active_contracts
FROM plans p
ORDER BY p.id`);

// ===== Lv.51〜70 PostgreSQL実践（開発部・SRE・データエンジニア）=====
add(51, 5, "medium", "Lv.51 顧客規模ランキング",
  "最後の配属先は開発部・データエンジニアチームです。ここではPostgreSQLの実践的な機能を学びます。まずはWindow関数の入門として「契約企業を従業員数の多い順にランキングしてほしい」との依頼。ROW_NUMBERで順位をrnとして振り、企業名・従業員数とあわせて順位順に表示してください。",
  "ROW_NUMBER() OVER (ORDER BY employee_count DESC) で連番が振れます",
  ["customers"],
  `SELECT company_name, employee_count,
  ROW_NUMBER() OVER (ORDER BY employee_count DESC) AS rn
FROM customers
ORDER BY rn`);

add(52, 5, "medium", "Lv.52 同額の請求は同じ順位に",
  "開発部の先輩から「ROW_NUMBERは同額でも別の番号になる。同額を同順位にしたいならRANKだよ」と教わりました。invoicesの請求金額にRANKで順位（amount_rank）を付け、請求ID・金額とあわせて金額の大きい順・同額なら請求IDの昇順で表示してください。",
  "RANK() OVER (ORDER BY amount DESC) は同額に同じ順位を付け、次の順位を飛ばします",
  ["invoices"],
  `SELECT id, amount,
  RANK() OVER (ORDER BY amount DESC) AS amount_rank
FROM invoices
ORDER BY amount DESC, id`);

add(53, 5, "medium", "Lv.53 企業ごとの登録順を振る",
  "カスタマーサクセスから「各企業で何番目に登録されたユーザーかを知りたい。オンボーディングの分析に使うんだ」と依頼されました。PARTITION BYを使って企業ごとに登録日順の連番（member_no）を振り、企業ID・氏名とあわせて企業ID・連番の順で表示してください。",
  "OVER (PARTITION BY customer_id ORDER BY created_at) で企業ごとに連番がリセットされます",
  ["users"],
  `SELECT customer_id, name,
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at) AS member_no
FROM users
ORDER BY customer_id, member_no`);

add(54, 5, "medium", "Lv.54 各請求に月合計を並べて表示",
  "経理部から「請求の明細一覧に、その月の合計額も並べて表示したい。明細と合計を行き来するのが大変で」と相談されました。Window関数のSUMを使い、請求ID・請求月・金額に加えて、同じ請求月の合計金額をmonth_totalとして請求IDの昇順で表示してください。GROUP BYと違い、行を潰さずに集計できるのがポイントです。",
  "SUM(amount) OVER (PARTITION BY billing_month) で月ごとの合計を各行に付けられます",
  ["invoices"],
  `SELECT id, billing_month, amount,
  SUM(amount) OVER (PARTITION BY billing_month) AS month_total
FROM invoices
ORDER BY id`);

add(55, 5, "hard", "Lv.55 売上の累計を出す",
  "経営企画室から「月次売上の推移に、累計の列も足してほしい」と依頼されました。月ごとの請求額合計をCTEで集計した上で、Window関数のSUMを使って請求月順の累計をcumulative_totalとして計算し、請求月の昇順で表示してください。",
  "SUM(total) OVER (ORDER BY billing_month) と書くと先頭からの累計になります",
  ["invoices"],
  `WITH monthly AS (
  SELECT billing_month, SUM(amount) AS total
  FROM invoices
  GROUP BY billing_month
)
SELECT billing_month, total,
  SUM(total) OVER (ORDER BY billing_month) AS cumulative_total
FROM monthly
ORDER BY billing_month`);

add(56, 5, "hard", "Lv.56 前月との差分を計算する",
  "続けて「月次売上が前の月からいくら増えたのかも見たい」とのリクエストです。LAG関数で前月の売上を参照し、当月と前月の差をdiffとして計算してください。月ごとの売上はCTEで集計し、請求月の昇順で表示します。最初の月は前月がないため差分は空欄（NULL）になります。",
  "LAG(total) OVER (ORDER BY billing_month) で1つ前の行の値を参照できます",
  ["invoices"],
  `WITH monthly AS (
  SELECT billing_month, SUM(amount) AS total
  FROM invoices
  GROUP BY billing_month
)
SELECT billing_month, total,
  total - LAG(total) OVER (ORDER BY billing_month) AS diff
FROM monthly
ORDER BY billing_month`);

add(57, 5, "hard", "Lv.57 各ユーザーの最終ログイン",
  "SREチームから「監査対応で、ユーザーごとの最後のログイン日時の一覧が必要になった」と依頼されました。ROW_NUMBERをPARTITION BYと組み合わせてユーザーごとにログインを新しい順に順位付けし、1位の行だけを取り出して、ユーザーIDとログイン日時をユーザーIDの昇順で表示してください。PostgreSQLならDISTINCT ONでも書ける、定番の「グループごとの最新1件」問題です。",
  "CTEで ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_at DESC) を振り、WHERE rn = 1 で絞ります",
  ["login_logs"],
  `WITH ranked AS (
  SELECT user_id, login_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_at DESC) AS rn
  FROM login_logs
)
SELECT user_id, login_at
FROM ranked
WHERE rn = 1
ORDER BY user_id`);

add(58, 5, "hard", "Lv.58 FILTERで件数を出し分ける",
  "カスタマーサクセスから「問い合わせの全件数と、そのうち対応中（open）の件数を1行で見たい」と依頼されました。集計関数のFILTER句を使って、全件数をtotal_tickets、open件数をopen_ticketsとして1つのSQLで集計してください。CASE式より宣言的に書ける、PostgreSQLらしい書き方です。",
  "COUNT(*) FILTER (WHERE status = 'open') のように書きます",
  ["support_tickets"],
  `SELECT COUNT(*) AS total_tickets,
  COUNT(*) FILTER (WHERE status = 'open') AS open_tickets
FROM support_tickets`);

add(59, 5, "hard", "Lv.59 月別の支払済み・未払い金額",
  "経理部から「月ごとに、支払済みの金額と未払いの金額を横に並べた表がほしい」と依頼されました。FILTER句をGROUP BYと組み合わせて、請求月ごとに支払済み金額（paid_amount）と未払い金額（unpaid_amount）を集計し、請求月の昇順で表示してください。該当がない月は空欄（NULL）になります。",
  "SUM(amount) FILTER (WHERE paid = 1) を月ごとにグループ化します",
  ["invoices"],
  `SELECT billing_month,
  SUM(amount) FILTER (WHERE paid = 1) AS paid_amount,
  SUM(amount) FILTER (WHERE paid = 0) AS unpaid_amount
FROM invoices
GROUP BY billing_month
ORDER BY billing_month`);

add(60, 5, "hard", "Lv.60 機能利用ランキングに順位を付ける",
  "プロダクトマネージャーから「Lv.28の機能ランキング、正式なレポートにするので順位の列も付けてほしい」と依頼が来ました。feature_usageとproductsを結合して機能ごとの利用回数（usage_count）を集計し、RANKで順位（usage_rank）を付けて順位順に表示してください。集計とWindow関数は組み合わせられます。",
  "RANK() OVER (ORDER BY COUNT(*) DESC) のように、集計結果に対してWindow関数を使えます",
  ["feature_usage", "products"],
  `SELECT p.product_name, COUNT(*) AS usage_count,
  RANK() OVER (ORDER BY COUNT(*) DESC) AS usage_rank
FROM feature_usage f
INNER JOIN products p ON f.product_id = p.id
GROUP BY p.product_name
ORDER BY usage_rank`);

add(61, 5, "hard", "Lv.61 APIに渡すJSONを作る",
  "開発部から「社内APIのモックに使いたいので、企業データをJSON形式で返すクエリを書いてほしい」と頼まれました。json_object関数を使って、企業名（キー: name）と従業員数（キー: employees）を持つJSONをcustomer_jsonとして生成し、id順に先頭3社分を表示してください。PostgreSQLのjsonb_build_objectに対応する書き方です。",
  "json_object('name', company_name, 'employees', employee_count) の形でJSONが作れます",
  ["customers"],
  `SELECT json_object('name', company_name, 'employees', employee_count) AS customer_json
FROM customers
ORDER BY id
LIMIT 3`);

add(62, 5, "hard", "Lv.62 曜日別のログイン傾向",
  "SREチームから「サーバー増強の計画のため、曜日ごとのログイン回数の傾向を知りたい」と依頼されました。login_atから曜日番号（0=日曜〜6=土曜)をweekdayとして取り出し、曜日ごとのログイン回数をlogin_countとして集計して、曜日番号の昇順で表示してください。",
  "SQLiteでは strftime('%w', login_at) で曜日番号が取れます（PostgreSQLでは EXTRACT(DOW FROM ...)）",
  ["login_logs"],
  `SELECT strftime('%w', login_at) AS weekday, COUNT(*) AS login_count
FROM login_logs
GROUP BY weekday
ORDER BY weekday`);

add(63, 5, "hard", "Lv.63 売上の移動平均",
  "データ分析チームから「月次売上のブレをならして傾向を見たいので、直近2ヶ月の移動平均を出してほしい」と依頼されました。月ごとの売上をCTEで集計し、Window関数のフレーム指定（ROWS BETWEEN）を使って当月と前月の平均をmoving_avgとして計算し、請求月の昇順で表示してください。",
  "AVG(total) OVER (ORDER BY billing_month ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) と書きます",
  ["invoices"],
  `WITH monthly AS (
  SELECT billing_month, SUM(amount) AS total
  FROM invoices
  GROUP BY billing_month
)
SELECT billing_month, total,
  AVG(total) OVER (ORDER BY billing_month ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) AS moving_avg
FROM monthly
ORDER BY billing_month`);

add(64, 5, "hard", "Lv.64 インデックスを意識した絞り込み",
  "SREチームから「login_logsテーブルが巨大になってきた。user_idで絞ってlogin_atで並べるクエリが頻発するので、(user_id, login_at)の複合インデックスを張る予定。それが効く形のクエリを用意してほしい」と依頼されました。user_idが1のユーザーのログイン日時を、新しい順に取得してください。WHEREの等価条件とORDER BYがインデックスの並びと一致すると、高速に処理できます。",
  "インデックス列に関数や計算を挟まず、そのまま WHERE user_id = 1 と書くのがポイントです",
  ["login_logs"],
  `SELECT login_at
FROM login_logs
WHERE user_id = 1
ORDER BY login_at DESC`);

add(65, 5, "hard", "Lv.65 インデックスが効く日付条件",
  "開発部のコードレビューで「WHERE strftime('%Y', created_at) = '2025' のように列へ関数をかけるとインデックスが使えない」と指摘を受けました。関数を使わず範囲条件で書き直します。契約開始日が2025年（2025-01-01以上、2026-01-01未満）の企業について、企業名と契約開始日を契約開始日の昇順で取得してください。",
  "範囲条件 >= と < の組み合わせなら、インデックスがそのまま使えます（サーガブルな条件と呼ばれます）",
  ["customers"],
  `SELECT company_name, created_at
FROM customers
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'
ORDER BY created_at`);

add(66, 5, "hard", "Lv.66 次のログインまでの流れを見る",
  "データ分析チームから「特定ユーザーの利用間隔を調べたい。各ログインの隣に、その次のログイン日時を並べてほしい」と依頼されました。LEAD関数を使って、user_idが1のユーザーについてログイン日時と次のログイン日時（next_login)をログイン日時の昇順で表示してください。最後の行は次がないため空欄（NULL）になります。",
  "LEAD(login_at) OVER (ORDER BY login_at) で次の行の値を参照できます",
  ["login_logs"],
  `SELECT login_at,
  LEAD(login_at) OVER (ORDER BY login_at) AS next_login
FROM login_logs
WHERE user_id = 1
ORDER BY login_at`);

add(67, 5, "hard", "Lv.67 各企業の最初の契約プラン",
  "経営企画室から「各企業が最初にどのプランで契約を始めたのか知りたい。プラン変更の傾向を分析したいんだ」と依頼されました。FIRST_VALUEをPARTITION BYと組み合わせて、企業ごとに最初（started_atが最も早い）の契約のプラン名をfirst_planとして取得し、企業IDの昇順で重複なく表示してください。",
  "FIRST_VALUE(p.plan_name) OVER (PARTITION BY s.customer_id ORDER BY s.started_at) と DISTINCT を組み合わせます",
  ["subscriptions", "plans"],
  `SELECT DISTINCT s.customer_id,
  FIRST_VALUE(p.plan_name) OVER (PARTITION BY s.customer_id ORDER BY s.started_at) AS first_plan
FROM subscriptions s
INNER JOIN plans p ON s.plan_id = p.id
ORDER BY s.customer_id`);

add(68, 5, "hard", "Lv.68 企業を規模で4グループに分ける",
  "マーケティング部から「顧客セグメント分析のため、企業を従業員数で均等に4グループへ分けてほしい」と依頼されました。NTILE関数を使って、従業員数の多い順に4分割したグループ番号をsize_groupとして振り、企業名・従業員数とあわせて従業員数の多い順に表示してください。",
  "NTILE(4) OVER (ORDER BY employee_count DESC) で4等分のグループ番号が振れます",
  ["customers"],
  `SELECT company_name, employee_count,
  NTILE(4) OVER (ORDER BY employee_count DESC) AS size_group
FROM customers
ORDER BY employee_count DESC`);

add(69, 5, "hard", "Lv.69 解約予兆のある企業を探す",
  "カスタマーサクセスとデータ分析チームの合同プロジェクトです。「契約中なのに、直近（2026-07-01以降）誰もログインしていない企業は解約リスクが高い。今すぐリストがほしい」との緊急依頼。契約中（status='active'）の契約を持つ企業のうち、所属ユーザーの誰も2026-07-01以降にログインしていない企業名を、NOT EXISTSを使って昇順で取得してください。",
  "NOT EXISTS のサブクエリで「最近ログインしたユーザーがいない」ことを表現します",
  ["customers", "subscriptions", "users", "login_logs"],
  `SELECT c.company_name
FROM customers c
INNER JOIN subscriptions s ON c.id = s.customer_id
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    INNER JOIN login_logs l ON u.id = l.user_id
    WHERE u.customer_id = c.id AND l.login_at >= '2026-07-01'
  )
ORDER BY c.company_name`);

add(70, 5, "hard", "Lv.70 卒業課題：MRR構成比レポート",
  "いよいよ卒業課題です。CEOへの事業報告に使う「プラン別MRRとその構成比」のレポートを、あなたが一人で作ることになりました。契約中の契約からプラン別MRRをCTEで集計し、Window関数で全体に対する構成比（share、%表記で小数第1位まで）を計算して、MRRの大きい順に表示してください。これが書ければ、新人データアナリスト卒業です。おめでとう！",
  "SUM(mrr) OVER () で全体合計が取れます。ROUND(100.0 * mrr / SUM(mrr) OVER (), 1) が構成比です",
  ["subscriptions", "plans"],
  `WITH plan_mrr AS (
  SELECT p.plan_name, SUM(p.monthly_fee) AS mrr
  FROM subscriptions s
  INNER JOIN plans p ON s.plan_id = p.id
  WHERE s.status = 'active'
  GROUP BY p.plan_name
)
SELECT plan_name, mrr,
  ROUND(100.0 * mrr / SUM(mrr) OVER (), 1) AS share
FROM plan_mrr
ORDER BY mrr DESC`);

// ---------------------------------------------------------------
// 実行 & マイグレーション生成
// ---------------------------------------------------------------
const esc = (s) => String(s).replace(/'/g, "''");

async function main() {
  const SQL = await initSqlJs();
  const out = [];
  out.push(`-- Kufu Cloud 問題セット（Lv.1〜70）`);
  out.push(`-- 既存の問題データを全て置き換える。result_json は sql.js（SQLite）で正解SQLを実行して生成した。`);
  out.push(``);
  out.push(`DELETE FROM progress;`);
  out.push(`DELETE FROM expected_results;`);
  out.push(`DELETE FROM schemas;`);
  out.push(`DELETE FROM problems;`);
  out.push(`DELETE FROM categories;`);
  out.push(``);
  for (const c of CATEGORIES) {
    out.push(`INSERT INTO categories (id, name, description, sort_order) VALUES (${c.id}, '${esc(c.name)}', '${esc(c.desc)}', ${c.id});`);
  }
  out.push(``);

  const sortCounters = {};
  let fail = 0;
  for (const p of P) {
    const ddl = p.tables.map((t) => DDL[t]).join("\n\n");
    const seed = p.tables.flatMap((t) => SEED[t]).join("\n");

    // フロント（useSqlJs.execute）と同じロジックで結果を作る
    const db = new SQL.Database();
    let rows;
    try {
      db.run(ddl);
      db.run(seed);
      const results = db.exec(p.sql);
      if (results.length === 0) throw new Error("no result");
      const { columns, values } = results[0];
      rows = values.map((row) =>
        Object.fromEntries(columns.map((col, i) => [col, String(row[i] ?? "")]))
      );
    } catch (e) {
      console.error(`❌ Lv.${p.id} ${p.title}: ${e.message}`);
      fail++;
      db.close();
      continue;
    }
    db.close();

    if (rows.length === 0) console.warn(`⚠ Lv.${p.id}: 0行`);
    if (rows.length > 16) console.warn(`⚠ Lv.${p.id}: ${rows.length}行（多め）`);

    sortCounters[p.cat] = (sortCounters[p.cat] ?? 0) + 1;
    const resultJson = JSON.stringify(rows);

    out.push(`-- ${p.title}`);
    out.push(`INSERT INTO problems (id, category_id, title, description, difficulty, hint, sort_order) VALUES`);
    out.push(`  (${p.id}, ${p.cat}, '${esc(p.title)}', '${esc(p.desc)}', '${p.diff}', '${esc(p.hint)}', ${sortCounters[p.cat]});`);
    out.push(`INSERT INTO schemas (problem_id, ddl, seed_data) VALUES`);
    out.push(`  (${p.id}, '${esc(ddl)}', '${esc(seed)}');`);
    out.push(`INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES`);
    out.push(`  (${p.id}, '${esc(p.sql)}', '${esc(resultJson)}');`);
    out.push(``);
    console.log(`✅ Lv.${p.id} ${p.title} — ${rows.length}行`);
  }

  out.push(`SELECT setval('categories_id_seq', ${CATEGORIES.length});`);
  out.push(`SELECT setval('problems_id_seq', ${P.length});`);
  out.push(``);

  if (fail > 0) {
    console.error(`\n${fail}問でエラー。マイグレーションは出力しません。`);
    process.exit(1);
  }
  const dest = path.join(__dirname, "../../backend/migrations/002_kufu_cloud_problems.sql");
  fs.writeFileSync(dest, out.join("\n"));
  console.log(`\n📄 ${dest} を出力しました（${P.length}問）`);
}

main();
