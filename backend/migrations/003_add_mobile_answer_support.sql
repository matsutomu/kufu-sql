-- モバイル穴埋め回答モードのためのスキーマ拡張
-- sql_template/blanks はモバイル対応済みの問題のみ値を持つ（対象外の問題はNULLのままPC版にフォールバック）

ALTER TABLE problems ADD COLUMN sql_template TEXT;
ALTER TABLE problems ADD COLUMN blanks TEXT;

ALTER TABLE progress ADD COLUMN answer_mode TEXT CHECK (answer_mode IN ('pc', 'mobile'));
