-- カテゴリテーブル
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 問題テーブル
CREATE TABLE problems (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty  TEXT CHECK (difficulty IN ('easy','medium','hard')),
  hint        TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- スキーマ定義テーブル（問題で使うDDL）
CREATE TABLE schemas (
  id         SERIAL PRIMARY KEY,
  problem_id INTEGER REFERENCES problems(id),
  ddl        TEXT NOT NULL,
  seed_data  TEXT
);

-- 期待する結果テーブル
CREATE TABLE expected_results (
  id         SERIAL PRIMARY KEY,
  problem_id INTEGER REFERENCES problems(id),
  answer_sql TEXT NOT NULL,
  result_json TEXT NOT NULL
);

-- 進捗テーブル
CREATE TABLE progress (
  id           SERIAL PRIMARY KEY,
  session_id   TEXT NOT NULL,
  problem_id   INTEGER REFERENCES problems(id),
  is_correct   BOOLEAN DEFAULT FALSE,
  attempts     INTEGER DEFAULT 0,
  solved_at    TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, problem_id)
);

-- インデックス
CREATE INDEX idx_progress_session ON progress(session_id);
CREATE INDEX idx_problems_category ON problems(category_id);
