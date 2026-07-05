-- カテゴリ投入
INSERT INTO categories (name, description, sort_order) VALUES
  ('SELECT基礎', 'SELECT文の基本を学ぶ', 1),
  ('集計・グループ化', 'COUNT・SUM・GROUP BYを学ぶ', 2);

-- 問題1：全カラムを取得する
INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (1, '全カラムを取得する', 
  'employeesテーブルから全ての行・全てのカラムを取得してください。',
  'easy', 'SELECT * を使います', 1);

INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (1,
  'CREATE TABLE employees (
     id INTEGER,
     name TEXT,
     department TEXT,
     salary INTEGER
   );',
  'INSERT INTO employees VALUES (1, ''田中 太郎'', ''営業'', 400000);
   INSERT INTO employees VALUES (2, ''佐藤 花子'', ''開発'', 450000);
   INSERT INTO employees VALUES (3, ''鈴木 次郎'', ''営業'', 380000);'
);

INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (1,
  'SELECT * FROM employees',
  '[{"id":"1","name":"田中 太郎","department":"営業","salary":"400000"},
    {"id":"2","name":"佐藤 花子","department":"開発","salary":"450000"},
    {"id":"3","name":"鈴木 次郎","department":"営業","salary":"380000"}]'
);

-- 問題2：特定カラムを取得する
INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (1, '特定カラムを取得する',
  'employeesテーブルからnameとdepartmentのみ取得してください。',
  'easy', 'SELECT カラム名, カラム名 のように指定します', 2);

INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (2,
  'CREATE TABLE employees (
     id INTEGER,
     name TEXT,
     department TEXT,
     salary INTEGER
   );',
  'INSERT INTO employees VALUES (1, ''田中 太郎'', ''営業'', 400000);
   INSERT INTO employees VALUES (2, ''佐藤 花子'', ''開発'', 450000);
   INSERT INTO employees VALUES (3, ''鈴木 次郎'', ''営業'', 380000);'
);

INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (2,
  'SELECT name, department FROM employees',
  '[{"name":"田中 太郎","department":"営業"},
    {"name":"佐藤 花子","department":"開発"},
    {"name":"鈴木 次郎","department":"営業"}]'
);

-- 問題3：条件で絞り込む
INSERT INTO problems (category_id, title, description, difficulty, hint, sort_order)
VALUES (1, 'WHERE句で条件を指定する',
  'employeesテーブルから部署が「営業」の従業員を全て取得してください。',
  'easy', 'WHERE department = ''営業'' のように指定します', 3);

INSERT INTO schemas (problem_id, ddl, seed_data) VALUES (3,
  'CREATE TABLE employees (
     id INTEGER,
     name TEXT,
     department TEXT,
     salary INTEGER
   );',
  'INSERT INTO employees VALUES (1, ''田中 太郎'', ''営業'', 400000);
   INSERT INTO employees VALUES (2, ''佐藤 花子'', ''開発'', 450000);
   INSERT INTO employees VALUES (3, ''鈴木 次郎'', ''営業'', 380000);'
);

INSERT INTO expected_results (problem_id, answer_sql, result_json) VALUES (3,
  'SELECT * FROM employees WHERE department = ''営業''',
  '[{"id":"1","name":"田中 太郎","department":"営業","salary":"400000"},
    {"id":"3","name":"鈴木 次郎","department":"営業","salary":"380000"}]'
);
