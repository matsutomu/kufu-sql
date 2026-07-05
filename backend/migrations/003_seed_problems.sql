-- SELECT基礎（問題4〜10）
INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (1, '並び替え（昇順）',
  'employeesテーブルのsalaryを昇順で取得してください。',
  'easy', 'ORDER BY カラム名 ASC を使います', 4);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (4,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (4,
  'SELECT * FROM employees ORDER BY salary ASC',
  '[{"id":"3","name":"鈴木 次郎","department":"営業","salary":"380000"},{"id":"1","name":"田中 太郎","department":"営業","salary":"400000"},{"id":"2","name":"佐藤 花子","department":"開発","salary":"450000"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (1, '並び替え（降順）',
  'employeesテーブルのsalaryを降順で取得してください。',
  'easy', 'ORDER BY カラム名 DESC を使います', 5);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (5,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (5,
  'SELECT * FROM employees ORDER BY salary DESC',
  '[{"id":"2","name":"佐藤 花子","department":"開発","salary":"450000"},{"id":"1","name":"田中 太郎","department":"営業","salary":"400000"},{"id":"3","name":"鈴木 次郎","department":"営業","salary":"380000"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (1, '件数を制限する',
  'employeesテーブルから上位2件のみ取得してください。',
  'easy', 'LIMIT 数字 を使います', 6);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (6,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (6,
  'SELECT * FROM employees LIMIT 2',
  '[{"id":"1","name":"田中 太郎","department":"営業","salary":"400000"},{"id":"2","name":"佐藤 花子","department":"開発","salary":"450000"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (1, '重複を除外する',
  'employeesテーブルからdepartmentの重複を除いて取得してください。',
  'medium', 'SELECT DISTINCT を使います', 7);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (7,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (7,
  'SELECT DISTINCT department FROM employees',
  '[{"department":"営業"},{"department":"開発"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (1, 'NULL値を検索する',
  'employeesテーブルからdepartmentがNULLの従業員を取得してください。',
  'medium', 'IS NULL を使います', 8);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (8,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',NULL,400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (8,
  'SELECT * FROM employees WHERE department IS NULL',
  '[{"id":"1","name":"田中 太郎","department":"","salary":"400000"}]');

-- 集計・グループ化（問題9〜18）
INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, '件数を数える',
  'employeesテーブルの全件数を取得してください。',
  'easy', 'COUNT(*) を使います', 1);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (9,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (9,
  'SELECT COUNT(*) FROM employees',
  '[{"COUNT(*)":"3"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, '合計を計算する',
  'employeesテーブルのsalaryの合計を取得してください。',
  'easy', 'SUM() を使います', 2);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (10,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (10,
  'SELECT SUM(salary) FROM employees',
  '[{"SUM(salary)":"1230000"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, '平均を計算する',
  'employeesテーブルのsalaryの平均を取得してください。',
  'easy', 'AVG() を使います', 3);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (11,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (11,
  'SELECT AVG(salary) FROM employees',
  '[{"AVG(salary)":"410000.0"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, '最大値を取得する',
  'employeesテーブルのsalaryの最大値を取得してください。',
  'easy', 'MAX() を使います', 4);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (12,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (12,
  'SELECT MAX(salary) FROM employees',
  '[{"MAX(salary)":"450000"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, '最小値を取得する',
  'employeesテーブルのsalaryの最小値を取得してください。',
  'easy', 'MIN() を使います', 5);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (13,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (13,
  'SELECT MIN(salary) FROM employees',
  '[{"MIN(salary)":"380000"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, 'グループ化して集計する',
  'employeesテーブルをdepartment別に件数を集計してください。',
  'medium', 'GROUP BY を使います', 6);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (14,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (14,
  'SELECT department, COUNT(*) FROM employees GROUP BY department',
  '[{"department":"営業","COUNT(*)":"2"},{"department":"開発","COUNT(*)":"1"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, 'グループ化して平均を計算する',
  'employeesテーブルをdepartment別にsalaryの平均を計算してください。',
  'medium', 'GROUP BY と AVG() を組み合わせます', 7);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (15,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (15,
  'SELECT department, AVG(salary) FROM employees GROUP BY department',
  '[{"department":"営業","AVG(salary)":"390000.0"},{"department":"開発","AVG(salary)":"450000.0"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, 'HAVINGで絞り込む',
  'employeesテーブルをdepartment別に集計し、件数が2以上の部署のみ取得してください。',
  'hard', 'GROUP BY の後に HAVING を使います', 8);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (16,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (16,
  'SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) >= 2',
  '[{"department":"営業","COUNT(*)":"2"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, 'サブクエリを使う',
  'employeesテーブルからsalaryが平均以上の従業員を取得してください。',
  'hard', 'WHERE salary >= (SELECT AVG(salary) ...) のようにサブクエリを使います', 9);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (17,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (17,
  'SELECT * FROM employees WHERE salary >= (SELECT AVG(salary) FROM employees)',
  '[{"id":"1","name":"田中 太郎","department":"営業","salary":"400000"},{"id":"2","name":"佐藤 花子","department":"開発","salary":"450000"}]');

INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (2, 'CASE式で条件分岐する',
  'employeesテーブルのsalaryが400000以上なら「高給」、未満なら「標準」と表示してください。',
  'hard', 'CASE WHEN ... THEN ... ELSE ... END を使います', 10);
INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (18,
  'CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, salary INTEGER);',
  'INSERT INTO employees VALUES (1,''田中 太郎'',''営業'',400000);
   INSERT INTO employees VALUES (2,''佐藤 花子'',''開発'',450000);
   INSERT INTO employees VALUES (3,''鈴木 次郎'',''営業'',380000);');
INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (18,
  'SELECT name, CASE WHEN salary >= 400000 THEN ''高給'' ELSE ''標準'' END as level FROM employees',
  '[{"name":"田中 太郎","level":"高給"},{"name":"佐藤 花子","level":"高給"},{"name":"鈴木 次郎","level":"標準"}]');
