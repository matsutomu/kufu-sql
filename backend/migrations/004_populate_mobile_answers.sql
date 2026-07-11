-- モバイル穴埋め回答モード用データの投入（既存行のUPDATEのみ。DELETE/INSERTは行わない）
-- 003_add_mobile_answer_support.sql の後に適用する。002の再適用は不要（progressが全削除されるため本番厳禁）。

-- Lv.1 はじめての顧客リスト
UPDATE problems SET sql_template = '{kw1} * {kw2} customers', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]}}' WHERE id = 1;
-- Lv.2 企業名と業界だけの一覧
UPDATE problems SET sql_template = '{kw1} company_name, industry {kw2} customers', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]}}' WHERE id = 2;
-- Lv.3 IT業界の企業を探す
UPDATE problems SET sql_template = '{kw1} * {kw2} customers {kw3} industry = ''IT''', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"WHERE","options":["WHERE","HAVING","AND"]}}' WHERE id = 3;
-- Lv.4 大口顧客の候補を絞り込む
UPDATE problems SET sql_template = '{kw1} * {kw2} customers {kw3} employee_count >= 100', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"WHERE","options":["WHERE","HAVING","AND"]}}' WHERE id = 4;
-- Lv.5 請求書の宛名チェック
UPDATE problems SET sql_template = '{kw1} company_name {kw2} customers {kw3} company_name {kw4} ''株式会社%'' {kw5} id', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"WHERE","options":["WHERE","HAVING","AND"]},"kw4":{"type":"keyword","correct":"LIKE","options":["LIKE","=","IN"]},"kw5":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]}}' WHERE id = 5;
-- Lv.6 新しい契約から順に並べる
UPDATE problems SET sql_template = '{kw1} company_name, created_at {kw2} customers {kw3} created_at {kw4}', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"kw4":{"type":"keyword","correct":"DESC","options":["DESC","ASC","LIMIT"]}}' WHERE id = 6;
-- Lv.7 料金プランを安い順に
UPDATE problems SET sql_template = '{kw1} plan_name, monthly_fee {kw2} plans {kw3} monthly_fee {kw4}', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"kw4":{"type":"keyword","correct":"ASC","options":["ASC","DESC","LIMIT"]}}' WHERE id = 7;
-- Lv.8 従業員数トップ3の企業
UPDATE problems SET sql_template = '{kw1} company_name, employee_count {kw2} customers {kw3} employee_count {kw4} {kw5} 3', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"kw4":{"type":"keyword","correct":"DESC","options":["DESC","ASC","LIMIT"]},"kw5":{"type":"keyword","correct":"LIMIT","options":["LIMIT","OFFSET","TOP"]}}' WHERE id = 8;
-- Lv.9 条件を組み合わせて絞り込む
UPDATE problems SET sql_template = '{kw1} company_name, employee_count {kw2} customers {kw3} industry = ''IT'' {kw4} employee_count < 50 {kw5} id', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"WHERE","options":["WHERE","HAVING","AND"]},"kw4":{"type":"keyword","correct":"AND","options":["AND","OR","WHERE"]},"kw5":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]}}' WHERE id = 9;
-- Lv.10 一番安い有料プランはどれ？
UPDATE problems SET sql_template = '{kw1} plan_name, monthly_fee {kw2} plans {kw3} monthly_fee > 0 {kw4} monthly_fee {kw5} {kw6} 1', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"WHERE","options":["WHERE","HAVING","AND"]},"kw4":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"kw5":{"type":"keyword","correct":"ASC","options":["ASC","DESC","LIMIT"]},"kw6":{"type":"keyword","correct":"LIMIT","options":["LIMIT","OFFSET","TOP"]}}' WHERE id = 10;
-- Lv.11 契約企業数を数える
UPDATE problems SET sql_template = '{kw1} COUNT{p1}*{p2} {kw2} customers', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 11;
-- Lv.12 アクティブユーザー数を数える
UPDATE problems SET sql_template = '{kw1} COUNT{p1}*{p2} {kw2} users {kw3} status = ''active''', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"WHERE","options":["WHERE","HAVING","AND"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 12;
-- Lv.13 今月の請求総額
UPDATE problems SET sql_template = '{kw1} SUM{p1}amount{p2} AS total_amount {kw2} invoices {kw3} billing_month = ''2026-06''', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"WHERE","options":["WHERE","HAVING","AND"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 13;
-- Lv.14 顧客企業の平均規模
UPDATE problems SET sql_template = '{kw1} AVG{p1}employee_count{p2} AS avg_employees {kw2} customers', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 14;
-- Lv.15 最大の企業と最小の企業
UPDATE problems SET sql_template = '{kw1} MAX{p1}employee_count{p2} AS max_employees, MIN{p3}employee_count{p4} AS min_employees {kw2} customers', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]},"p3":{"type":"paren","correct":"(","options":["(","[","{"]},"p4":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 15;
-- Lv.16 業界別の企業数
UPDATE problems SET sql_template = '{kw1} industry, COUNT{p1}*{p2} AS company_count {kw2} customers {kw3} industry {kw4} industry', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"GROUP BY","options":["GROUP BY","ORDER BY","HAVING"]},"kw4":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 16;
-- Lv.17 どんな部署に使われている？
UPDATE problems SET sql_template = '{kw1} department, COUNT{p1}*{p2} AS user_count {kw2} users {kw3} department {kw4} department', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"GROUP BY","options":["GROUP BY","ORDER BY","HAVING"]},"kw4":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 17;
-- Lv.18 月別の請求額推移
UPDATE problems SET sql_template = '{kw1} billing_month, SUM{p1}amount{p2} AS total_amount {kw2} invoices {kw3} billing_month {kw4} billing_month', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"GROUP BY","options":["GROUP BY","ORDER BY","HAVING"]},"kw4":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 18;
-- Lv.19 問い合わせの多い企業を見つける
UPDATE problems SET sql_template = '{kw1} customer_id, COUNT{p1}*{p2} AS ticket_count {kw2} support_tickets {kw3} customer_id {kw4} COUNT{p3}*{p4} >= 2 {kw5} customer_id', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"GROUP BY","options":["GROUP BY","ORDER BY","HAVING"]},"kw4":{"type":"keyword","correct":"HAVING","options":["HAVING","WHERE","AND"]},"kw5":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]},"p3":{"type":"paren","correct":"(","options":["(","[","{"]},"p4":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 19;
-- Lv.20 実際にログインした人数
UPDATE problems SET sql_template = '{kw1} COUNT{p1}{kw2} user_id{p2} AS login_users {kw3} login_logs', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"DISTINCT","options":["DISTINCT","ALL","UNIQUE"]},"kw3":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 20;
-- Lv.21 ユーザーと所属企業をつなげる
UPDATE problems SET sql_template = '{kw1} u.id, u.name, c.company_name
{kw2} users u
{kw3} customers c {kw4} u.customer_id = c.id
{kw5} u.id', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"INNER JOIN","options":["INNER JOIN","LEFT JOIN","WHERE"]},"kw4":{"type":"keyword","correct":"ON","options":["ON","WHERE","AND"]},"kw5":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]}}' WHERE id = 21;
-- Lv.22 契約一覧にプラン名を付ける
UPDATE problems SET sql_template = '{kw1} s.id, p.plan_name, s.status
{kw2} subscriptions s
{kw3} plans p {kw4} s.plan_id = p.id
{kw5} s.id', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"INNER JOIN","options":["INNER JOIN","LEFT JOIN","WHERE"]},"kw4":{"type":"keyword","correct":"ON","options":["ON","WHERE","AND"]},"kw5":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]}}' WHERE id = 22;
-- Lv.25 一度も問い合わせのない企業
UPDATE problems SET sql_template = '{kw1} c.company_name
{kw2} customers c
{kw3} support_tickets t {kw4} c.id = t.customer_id
{kw5} t.id {kw6}
{kw7} c.company_name', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"LEFT JOIN","options":["LEFT JOIN","INNER JOIN","WHERE"]},"kw4":{"type":"keyword","correct":"ON","options":["ON","WHERE","AND"]},"kw5":{"type":"keyword","correct":"WHERE","options":["WHERE","HAVING","AND"]},"kw6":{"type":"keyword","correct":"IS NULL","options":["IS NULL","= NULL","IS NOT NULL"]},"kw7":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]}}' WHERE id = 25;
-- Lv.26 企業別の問い合わせ件数（ゼロ件も含む）
UPDATE problems SET sql_template = '{kw1} c.company_name, COUNT{p1}t.id{p2} AS ticket_count
{kw2} customers c
{kw3} support_tickets t {kw4} c.id = t.customer_id
{kw5} c.company_name
{kw6} c.company_name', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"LEFT JOIN","options":["LEFT JOIN","INNER JOIN","WHERE"]},"kw4":{"type":"keyword","correct":"ON","options":["ON","WHERE","AND"]},"kw5":{"type":"keyword","correct":"GROUP BY","options":["GROUP BY","ORDER BY","HAVING"]},"kw6":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 26;
-- Lv.27 直近のログイン5件
UPDATE problems SET sql_template = '{kw1} u.name, l.login_at
{kw2} login_logs l
{kw3} users u {kw4} l.user_id = u.id
{kw5} l.login_at {kw6}
{kw7} 5', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"INNER JOIN","options":["INNER JOIN","LEFT JOIN","WHERE"]},"kw4":{"type":"keyword","correct":"ON","options":["ON","WHERE","AND"]},"kw5":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"kw6":{"type":"keyword","correct":"DESC","options":["DESC","ASC","LIMIT"]},"kw7":{"type":"keyword","correct":"LIMIT","options":["LIMIT","OFFSET","TOP"]}}' WHERE id = 27;
-- Lv.28 人気機能ランキング
UPDATE problems SET sql_template = '{kw1} p.product_name, COUNT{p1}*{p2} AS usage_count
{kw2} feature_usage f
{kw3} products p {kw4} f.product_id = p.id
{kw5} p.product_name
{kw6} usage_count {kw7}', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"INNER JOIN","options":["INNER JOIN","LEFT JOIN","WHERE"]},"kw4":{"type":"keyword","correct":"ON","options":["ON","WHERE","AND"]},"kw5":{"type":"keyword","correct":"GROUP BY","options":["GROUP BY","ORDER BY","HAVING"]},"kw6":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"kw7":{"type":"keyword","correct":"DESC","options":["DESC","ASC","LIMIT"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 28;
-- Lv.32 一度もログインしていないユーザー
UPDATE problems SET sql_template = '{kw1} u.id, u.name
{kw2} users u
{kw3} login_logs l {kw4} u.id = l.user_id
{kw5} l.id {kw6}
{kw7} u.id', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"LEFT JOIN","options":["LEFT JOIN","INNER JOIN","WHERE"]},"kw4":{"type":"keyword","correct":"ON","options":["ON","WHERE","AND"]},"kw5":{"type":"keyword","correct":"WHERE","options":["WHERE","HAVING","AND"]},"kw6":{"type":"keyword","correct":"IS NULL","options":["IS NULL","= NULL","IS NOT NULL"]},"kw7":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]}}' WHERE id = 32;
-- Lv.35 企業別アクティブユーザー数
UPDATE problems SET sql_template = '{kw1} c.company_name, COUNT{p1}u.id{p2} AS active_users
{kw2} customers c
{kw3} users u {kw4} c.id = u.customer_id {kw5} u.status = ''active''
{kw6} c.company_name
{kw7} active_users {kw8}, c.company_name', blanks = '{"kw1":{"type":"keyword","correct":"SELECT","options":["SELECT","INSERT","UPDATE"]},"kw2":{"type":"keyword","correct":"FROM","options":["FROM","WHERE","JOIN"]},"kw3":{"type":"keyword","correct":"LEFT JOIN","options":["LEFT JOIN","INNER JOIN","WHERE"]},"kw4":{"type":"keyword","correct":"ON","options":["ON","WHERE","AND"]},"kw5":{"type":"keyword","correct":"AND","options":["AND","OR","WHERE"]},"kw6":{"type":"keyword","correct":"GROUP BY","options":["GROUP BY","ORDER BY","HAVING"]},"kw7":{"type":"keyword","correct":"ORDER BY","options":["ORDER BY","GROUP BY","WHERE"]},"kw8":{"type":"keyword","correct":"DESC","options":["DESC","ASC","LIMIT"]},"p1":{"type":"paren","correct":"(","options":["(","[","{"]},"p2":{"type":"paren","correct":")","options":[")","]","}"]}}' WHERE id = 35;
