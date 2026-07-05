-- 問題文をKufu Cloud世界観へリライト（SQL・正解・テーブル定義は変更しない）
-- 受講者は BtoB SaaS企業「Kufu Cloud」に入社した新人データアナリスト。
-- 各部署からの依頼を社員マスタ（employees）を使って解決しながら成長していく。

-- SELECT基礎（問題1〜8）
UPDATE problems SET description =
  'Kufu Cloudへようこそ！今日からあなたは新人データアナリストです。人事部の先輩から「まずはうちの社員データがどんな形か見てみて」と最初の仕事を任されました。社員マスタ（employees）に登録されている全ての行・全てのカラムを取得して、データの中身を確認しましょう。'
WHERE id = 1;

UPDATE problems SET description =
  '人事部から「社内報に載せる名簿を作りたいので、社員の氏名と所属部署だけをまとめてほしい」と依頼がありました。employeesからname（氏名）とdepartment（部署）の2つのカラムのみを取得してください。'
WHERE id = 2;

UPDATE problems SET description =
  '営業部のマネージャーから「チームの顔ぶれを確認したいので、営業メンバーの一覧がほしい」と声がかかりました。departmentが「営業」の社員を全て取得してください。'
WHERE id = 3;

UPDATE problems SET description =
  '経理部から「給与見直しの参考にしたいので、給与の低い順に並べた資料がほしい」と依頼されました。employeesの全カラムを、salary（給与）の昇順で取得してください。'
WHERE id = 4;

UPDATE problems SET description =
  '先ほどの資料を渡すと、経理部から「今度は給与の高い人から順に見たい」と追加の依頼が来ました。employeesの全カラムを、salaryの降順で取得してください。'
WHERE id = 5;

UPDATE problems SET description =
  '経営企画室から「全部はいらないので、まずサンプルとして先頭の数件だけ見せてほしい」とリクエストがありました。employeesから先頭の2件のみを取得してください。'
WHERE id = 6;

UPDATE problems SET description =
  '人事部の新メンバーから「今、社内にはどんな部署があるんですか？」と質問されました。employeesのdepartmentから重複を除いて、部署の一覧を取得してください。'
WHERE id = 7;

UPDATE problems SET description =
  '人事部で「所属部署が未登録のままになっている社員がいるらしい」と話題になっています。データアナリストの出番です。departmentがNULLの社員を探し出してください。'
WHERE id = 8;

-- 集計・グループ化（問題9〜18）
UPDATE problems SET description =
  '入社して数週間、集計の仕事も任されるようになりました。経営企画室から「役員会議で使うので、現在の社員数を報告してほしい」と依頼です。employeesの全件数を集計してください。'
WHERE id = 9;

UPDATE problems SET description =
  '経理部から「人件費を把握したいので、全社員の給与の合計額を出してほしい」と依頼がありました。salaryの合計を集計してください。'
WHERE id = 10;

UPDATE problems SET description =
  '続いて経理部から「来期の採用予算を立てるために、給与の平均額も知りたい」とのこと。salaryの平均を集計してください。'
WHERE id = 11;

UPDATE problems SET description =
  '人事部から「給与テーブルの上限を確認したいので、社内で最も高い給与額を教えてほしい」と依頼されました。salaryの最大値を取得してください。'
WHERE id = 12;

UPDATE problems SET description =
  '同じく人事部から「最低水準も見直したいので、最も低い給与額も確認したい」と続けて依頼が来ました。salaryの最小値を取得してください。'
WHERE id = 13;

UPDATE problems SET description =
  '経営企画室から「組織図を更新するので、部署ごとの人数をまとめてほしい」と依頼がありました。department別に社員の件数を集計してください。'
WHERE id = 14;

UPDATE problems SET description =
  '経理部から「部署ごとの給与水準を比較したい」という分析依頼です。department別にsalaryの平均を計算してください。'
WHERE id = 15;

UPDATE problems SET description =
  '経営企画室から「ある程度人数のいる部署だけを対象に施策を検討したい」と相談されました。department別に件数を集計し、件数が2以上の部署のみを取得してください。'
WHERE id = 16;

UPDATE problems SET description =
  '人事部から「給与が全社平均以上の社員のリストがほしい」と、少し難しい依頼が来ました。平均値は自分で計算せず、SQLの中で求めるのがポイントです。salaryが平均以上の社員を全て取得してください。'
WHERE id = 17;

UPDATE problems SET description =
  '経営企画室から「給与レポートにランクを付けて見やすくしたい」と依頼がありました。社員の氏名とあわせて、salaryが400000以上なら「高給」、未満なら「標準」と表示するlevel列を作ってください。'
WHERE id = 18;

-- AVGの期待結果を整数表記へ修正（salaryはINTEGERのため「.0」は不要）
UPDATE expected_results SET result_json =
  '[{"AVG(salary)":"410000"}]'
WHERE problem_id = 11;

UPDATE expected_results SET result_json =
  '[{"department":"営業","AVG(salary)":"390000"},{"department":"開発","AVG(salary)":"450000"}]'
WHERE problem_id = 15;
