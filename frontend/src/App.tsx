import { useState, useEffect, useCallback } from "react";
import { fetchProblems, fetchProblemDetail, fetchProgress, judge } from "./api/client";
import type { Problem, ProblemDetail, JudgeResponse } from "./api/client";
import { checkServiceAvailability, fetchEc2Status, isEc2Down } from "./api/availability";
import type { ServiceHours } from "./api/availability";
import { useSqlJs } from "./hooks/useSqlJs";
import { useDeviceMode } from "./hooks/useDeviceMode";
import "./index.css";

const SESSION_ID = (() => {
  const key = "kufu_session_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
})();

type Tab = "result" | "expected" | "hint";

// カラーテーマ（濃い青ベース）
const C = {
  primary: "#1e3a8a",      // メインの濃い青
  primaryDark: "#14284b",  // ヘッダーなどさらに濃い紺
  accent: "#7cc4ff",       // ロゴなどのアクセント（明るい青）
  action: "#2563eb",       // 実行ボタンなどのアクション色
  sidebarBg: "#f3f6fb",
  border: "#dde5f0",
  success: "#16a34a",
};

const CATEGORIES: Record<number, string> = {
  1: "Lv.1〜10 SQL基礎",
  2: "Lv.11〜20 集計",
  3: "Lv.21〜35 JOIN",
  4: "Lv.36〜50 分析",
  5: "Lv.51〜70 PostgreSQL実践",
};

export default function App() {
  const [problems, setProblems]     = useState<Problem[]>([]);
  const [selected, setSelected]     = useState<number | null>(null);
  const [detail, setDetail]         = useState<ProblemDetail | null>(null);
  const [sql, setSql]               = useState("");
  const [tab, setTab]               = useState<Tab>("result");
  const [judgeRes, setJudgeRes]     = useState<JudgeResponse | null>(null);
  const [sqlError, setSqlError]     = useState<string | null>(null);
  const [solvedIds, setSolvedIds]   = useState<Set<number>>(new Set());
  const [resultRows, setResultRows] = useState<Record<string,string>[]>([]);
  const [resultCols, setResultCols] = useState<string[]>([]);
  const [apiDown, setApiDown]       = useState(false);
  // おやすみ画面に表示するサービス時間（service-hours.json由来。取得失敗時はnull）
  const [serviceHours, setServiceHours] = useState<ServiceHours | null>(null);
  // 閉じているカテゴリのID（初期状態は全カテゴリ開いた状態）
  const [closedCats, setClosedCats] = useState<Set<number>>(new Set());
  // モバイル幅でのみ使う画面状態（一覧⇔詳細）。PC幅では参照しない
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const toggleCategory = (catId: number) => {
    setClosedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  const { loading: dbLoading, execute } = useSqlJs(
    detail?.schema.ddl ?? "",
    detail?.schema.seed_data ?? ""
  );
  const { isMobile } = useDeviceMode();

  useEffect(() => {
    let cancelled = false;

    const loadApp = () => {
      fetchProblems()
        .then((p) => { if (cancelled) return; setProblems(p); setApiDown(false); })
        .catch((e) => { console.error(e); if (!cancelled) setApiDown(true); });
      // サーバーに保存された進捗を復元（session_idはlocalStorageで永続化されている）
      fetchProgress(SESSION_ID)
        .then((items) => {
          if (cancelled) return;
          const solved = items.filter((it) => it.is_correct).map((it) => it.problem_id);
          if (solved.length > 0) setSolvedIds(new Set(solved));
        })
        .catch((e) => console.error(e));
    };

    // サービス時間・EC2状態・ヘルスチェックの順で可用性を判定する。時間外やEC2停止中は
    // 即closedが通知されておやすみ画面を出し、その後もヘルスチェックでAPIの稼働が
    // 確認できた場合はopenで再通知されるため、通常画面へ切り替える。
    checkServiceAvailability((result) => {
      if (cancelled) return;
      setServiceHours(result.serviceHours);
      if (result.status === "closed") {
        setApiDown(true);
        return;
      }
      setApiDown(false);
      loadApp();
    });

    // 表示中も30秒ごとに状態を再取得し、稼働中に停止へ切り替わったら自動で画面を切り替える
    const interval = setInterval(() => {
      fetchEc2Status().then((status) => {
        if (!cancelled && isEc2Down(status)) setApiDown(true);
      });
    }, 30000);

    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (selected == null) return;
    fetchProblemDetail(selected).then((d) => {
      setDetail(d);
      setSql("");
      setJudgeRes(null);
      setSqlError(null);
      setResultRows([]);
      setResultCols([]);
      setTab("result");
    });
  }, [selected]);

  const handleRun = useCallback(() => {
    if (!execute || !detail) return;
    setSqlError(null);
    setJudgeRes(null);
    try {
      const { columns, rows } = execute(sql);
      setResultCols(columns);
      setResultRows(rows);
      setTab("result");
      const answerMode = isMobile && hasMobileMode(detail.problem) ? "mobile" : "pc";
      judge(detail.problem.id, SESSION_ID, rows, answerMode).then((res) => {
        setJudgeRes(res);
        if (res.is_correct) setSolvedIds((prev) => new Set([...prev, detail.problem.id]));
      });
    } catch (e: any) {
      setSqlError(e.message);
      setResultRows([]);
      setResultCols([]);
    }
  }, [execute, sql, detail, isMobile]);

  const diffBadge = (d: string) => {
    const map: Record<string, string> = { easy: "初級", medium: "中級", hard: "上級" };
    const color: Record<string, string> = { easy: "#16a34a", medium: "#d97706", hard: "#dc2626" };
    return <span style={{ fontSize: 11, background: color[d] + "20", color: color[d], border: `1px solid ${color[d]}`, borderRadius: 4, padding: "1px 7px", marginLeft: 6 }}>{map[d]}</span>;
  };

  // カテゴリごとに問題をグループ化
  const grouped = problems.reduce((acc, p) => {
    if (!acc[p.category_id]) acc[p.category_id] = [];
    acc[p.category_id].push(p);
    return acc;
  }, {} as Record<number, Problem[]>);

  const solvedCount = solvedIds.size;
  const totalCount = problems.length;
  const progressPct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // 現在の問題の次（一覧の並び順で次の1件）。無ければ最終問題
  const currentIndex = problems.findIndex((p) => p.id === selected);
  const nextProblem = currentIndex >= 0 ? problems[currentIndex + 1] : undefined;
  const goToNextProblem = () => {
    if (!nextProblem) return;
    setSelected(nextProblem.id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif" }}>
      {/* ヘッダー */}
      <div style={{ background: C.primaryDark, color: "#fff", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>kufu<span style={{ color: C.accent }}>:SQL</span></span>
        <span style={{ fontSize: 11, color: "#9fb3d1", marginLeft: 4 }}>工夫</span>
      </div>

      {/* サービス時間外・API停止中はサイドバーも出さず、全画面でおやすみ画面を表示する
          （モバイル幅で空のサイドバーだけが表示されるのを防ぐ） */}
      {apiDown ? (
      <ClosedScreen serviceHours={serviceHours} />
      ) : (
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* サイドバー（モバイル幅では一覧画面のときだけ表示し、幅いっぱいに広げる） */}
        {(!isMobile || mobileView === "list") && (
        <div style={{ width: isMobile ? "100%" : 260, background: C.sidebarBg, borderRight: isMobile ? "none" : `1px solid ${C.border}`, overflowY: "auto", padding: "12px 10px", flexShrink: 0 }}>

          {/* はじめに（シナリオ紹介） */}
          <div
            onClick={() => { setSelected(null); setDetail(null); if (isMobile) setMobileView("detail"); }}
            style={{
              padding: "8px 10px", borderRadius: 6, marginBottom: 12, cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: detail == null ? C.primary : "#fff",
              color: detail == null ? "#fff" : C.primary,
              border: `1px solid ${detail == null ? C.primary : C.border}`,
              display: "flex", alignItems: "center", gap: 6,
            }}>
            <span>📖</span>
            <span>はじめに — Kufu Cloudの物語</span>
          </div>

          {/* 進捗バー */}
          <div style={{ marginBottom: 14, padding: "10px 10px", background: "#fff", borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 5 }}>
              <span>進捗</span>
              <span>{solvedCount} / {totalCount} 完了</span>
            </div>
            <div style={{ height: 5, background: C.border, borderRadius: 99 }}>
              <div style={{ height: 5, background: C.primary, borderRadius: 99, width: `${progressPct}%`, transition: "width 0.3s" }} />
            </div>
          </div>

          {/* カテゴリ別問題一覧 */}
          {Object.entries(grouped).map(([catId, probs]) => {
            const isOpen = !closedCats.has(Number(catId));
            const catSolved = probs.filter((p) => solvedIds.has(p.id)).length;
            return (
            <div key={catId} style={{ marginBottom: 12 }}>
              <div
                onClick={() => toggleCategory(Number(catId))}
                style={{ fontSize: 10, fontWeight: 700, color: "#8fa3c0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5, paddingLeft: 4, cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", fontSize: 8 }}>▶</span>
                <span style={{ flex: 1 }}>{CATEGORIES[Number(catId)] ?? `カテゴリ${catId}`}</span>
                {!isOpen && <span style={{ fontWeight: 400 }}>{catSolved}/{probs.length}</span>}
              </div>
              {isOpen && probs.map((p) => (
                <div key={p.id}
                  onClick={() => { setSelected(p.id); if (isMobile) setMobileView("detail"); }}
                  title={p.title}
                  style={{
                    padding: "7px 10px", borderRadius: 6, marginBottom: 2, cursor: "pointer", fontSize: 13,
                    background: selected === p.id ? C.primary : "transparent",
                    color: selected === p.id ? "#fff" : "#555",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  <span style={{ fontSize: 12, flexShrink: 0, color: selected === p.id ? "#fff" : solvedIds.has(p.id) ? C.primary : "#ccc" }}>
                    {solvedIds.has(p.id) ? "✓" : "○"}
                  </span>
                  {/* 長いタイトルは省略表示（ホバーで全文をツールチップ表示） */}
                  <span style={{ flex: 1, minWidth: 0, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</span>
                </div>
              ))}
            </div>
            );
          })}
        </div>
        )}

        {/* メインパネル（モバイル幅では詳細画面のときだけ表示し、幅いっぱいに広げる） */}
        {(!isMobile || mobileView === "detail") && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: isMobile ? "auto" : "hidden" }}>
          {isMobile && (
            <button onClick={() => setMobileView("list")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: C.sidebarBg, border: "none", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.primary, cursor: "pointer", flexShrink: 0, textAlign: "left" }}>
              ← 一覧に戻る
            </button>
          )}
          {!detail ? (
            <ScenarioIntro onStart={() => { if (problems.length > 0) setSelected(problems[0].id); }} />
          ) : (
            <>
              {/* 問題ヘッダー */}
              <div style={{ padding: "12px 18px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {detail.problem.title}{diffBadge(detail.problem.difficulty)}
                </div>
              </div>

              {/* 問題文 */}
              <div style={{ padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #f0f0f0", fontSize: 13, color: "#555", lineHeight: 1.7, flexShrink: 0 }}>
                <p>{detail.problem.description}</p>
                <pre style={{ marginTop: 8, background: "#fff", border: "1px solid #e5e5e5", borderRadius: 5, padding: "8px 10px", fontSize: 11, color: "#555", overflowX: "auto" }}>
                  {detail.schema.ddl}
                </pre>
              </div>

              {isMobile && !hasMobileMode(detail.problem) && (
                <div style={{ margin: "0 18px 10px", padding: "8px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, color: "#1e40af", fontSize: 12, lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 6, flexShrink: 0 }}>
                  <span>ℹ️</span>
                  <span>この問題はスマホの穴埋めモードに未対応です。SQL文を直接入力してください。</span>
                </div>
              )}

              {isMobile && hasMobileMode(detail.problem) ? (
                <MobileAnswerUI
                  problem={detail.problem} onSqlChange={setSql} onRun={handleRun} dbLoading={dbLoading}
                  tab={tab} onTabChange={setTab}
                  resultCols={resultCols} resultRows={resultRows} sqlError={sqlError} judgeRes={judgeRes}
                  detail={detail}
                  hasNextProblem={!!nextProblem} onNextProblem={goToNextProblem}
                />
              ) : (
                <SQLEditor
                  sql={sql} onSqlChange={setSql} onRun={handleRun} dbLoading={dbLoading}
                  tab={tab} onTabChange={setTab}
                  resultCols={resultCols} resultRows={resultRows} sqlError={sqlError} judgeRes={judgeRes}
                  detail={detail} isMobile={isMobile}
                  hasNextProblem={!!nextProblem} onNextProblem={goToNextProblem}
                />
              )}
            </>
          )}
        </div>
        )}
      </div>
      )}
    </div>
  );
}

// サービス時間外・API停止中に表示するおやすみ画面。
// serviceHoursが取得できている場合のみサービス時間と注記を表示する（取得失敗時は従来の文言のみ）。
function ClosedScreen({ serviceHours }: { serviceHours: ServiceHours | null }) {
  // "08:00" → "8:00" のように先頭のゼロを落として表示する
  const fmtTime = (t: string) => t.replace(/^0/, "");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 20 }}>
      <div style={{ fontSize: 52, lineHeight: 1 }}>🐱💤</div>
      <div style={{ fontWeight: 700, fontSize: 17, color: "#333" }}>ただいまサービス時間外です</div>
      <div style={{ fontSize: 13, color: "#888", textAlign: "center", lineHeight: 1.8 }}>
        kufu:SQL はおやすみ中です。<br />
        サービス時間内にまたお越しください。
      </div>
      {serviceHours && (
        <div style={{ fontSize: 13, color: "#555", textAlign: "center", lineHeight: 1.8 }}>
          サービス時間：{fmtTime(serviceHours.start)}〜{fmtTime(serviceHours.end)}
          （{serviceHours.timezone === "Asia/Tokyo" ? "日本時間" : serviceHours.timezone}）
          {serviceHours.note && (
            <>
              <br />
              <span style={{ fontSize: 11, color: "#999" }}>※{serviceHours.note}</span>
            </>
          )}
        </div>
      )}
      <button onClick={() => location.reload()}
        style={{ marginTop: 8, background: C.primary, color: "#fff", border: "none", borderRadius: 6, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
        再読み込み
      </button>
    </div>
  );
}

// SQL自由記述エディタ。textareaでSQLを入力し、実行結果・期待結果・ヒントをタブ表示する。
// isMobile時のみ、実行ボタンを画面下部に固定表示する（PC版のレイアウトは一切変更しない）。
function SQLEditor({
  sql, onSqlChange, onRun, dbLoading,
  tab, onTabChange,
  resultCols, resultRows, sqlError, judgeRes,
  detail, isMobile,
  hasNextProblem, onNextProblem,
}: {
  sql: string;
  onSqlChange: (v: string) => void;
  onRun: () => void;
  dbLoading: boolean;
  tab: Tab;
  onTabChange: (t: Tab) => void;
  resultCols: string[];
  resultRows: Record<string, string>[];
  sqlError: string | null;
  judgeRes: JudgeResponse | null;
  detail: ProblemDetail;
  isMobile?: boolean;
  hasNextProblem?: boolean;
  onNextProblem?: () => void;
}) {
  const runButton = (
    <button onClick={onRun} disabled={dbLoading}
      style={{ background: dbLoading ? "#888" : C.action, color: "#fff", border: "none", borderRadius: 4, padding: isMobile ? "8px 20px" : "5px 14px", fontSize: isMobile ? 13 : 12, fontWeight: 600, cursor: dbLoading ? "not-allowed" : "pointer", width: isMobile ? "100%" : undefined }}>
      {dbLoading ? "初期化中..." : "▶ 実行"}
    </button>
  );

  if (!isMobile) {
    return (
      <>
        {/* エディタ */}
        <div style={{ background: "#1e1e2e", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#888" }}>SQL Editor — sql.js (SQLite)</span>
          {runButton}
        </div>
        <textarea value={sql} onChange={(e) => onSqlChange(e.target.value)}
          placeholder="SELECT * FROM customers;"
          style={{ background: "#1e1e2e", color: "#cdd6f4", border: "none", outline: "none", padding: "12px 16px", fontSize: 13, fontFamily: "Courier New, monospace", resize: "none", minHeight: 110, lineHeight: 1.7, flexShrink: 0 }}
        />

        <ResultPanel
          tab={tab} onTabChange={onTabChange}
          resultCols={resultCols} resultRows={resultRows} sqlError={sqlError} judgeRes={judgeRes}
          detail={detail}
        />
      </>
    );
  }

  return (
    <>
      <div style={{ paddingBottom: 64 }}>
        <div style={{ background: "#1e1e2e", padding: "8px 14px" }}>
          <span style={{ fontSize: 11, color: "#888" }}>SQL Editor — sql.js (SQLite)</span>
        </div>
        <textarea value={sql} onChange={(e) => onSqlChange(e.target.value)}
          placeholder="SELECT * FROM customers;"
          style={{ display: "block", width: "100%", boxSizing: "border-box", background: "#1e1e2e", color: "#cdd6f4", border: "none", outline: "none", padding: "12px 16px", fontSize: 13, fontFamily: "Courier New, monospace", resize: "none", minHeight: 110, lineHeight: 1.7 }}
        />

        <ResultPanel
          tab={tab} onTabChange={onTabChange}
          resultCols={resultCols} resultRows={resultRows} sqlError={sqlError} judgeRes={judgeRes}
          detail={detail}
        />

        <NextProblemBlock judgeRes={judgeRes} hasNextProblem={hasNextProblem} onNextProblem={onNextProblem} />
      </div>

      {/* 実行ボタン: モバイルでは画面下部に固定表示し、長い問題文でもスクロールせずアクセスできるようにする */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#1e1e2e", padding: "10px 14px", borderTop: "1px solid #333", zIndex: 20 }}>
        {runButton}
      </div>
    </>
  );
}

// 正解時に次の問題へ遷移するボタン（最終問題なら完了メッセージ）
function NextProblemBlock({
  judgeRes, hasNextProblem, onNextProblem,
}: {
  judgeRes: JudgeResponse | null;
  hasNextProblem?: boolean;
  onNextProblem?: () => void;
}) {
  if (!judgeRes?.is_correct) return null;
  if (hasNextProblem) {
    return (
      <button onClick={onNextProblem}
        style={{ display: "block", width: "calc(100% - 28px)", margin: "10px 14px", background: C.success, color: "#fff", border: "none", borderRadius: 6, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        次の問題へ →
      </button>
    );
  }
  return (
    <div style={{ margin: "10px 14px", padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, color: "#166534", fontSize: 13, textAlign: "center", fontWeight: 600 }}>
      🎉 お疲れ様でした！全問クリアです
    </div>
  );
}

// 実行結果／期待する結果／ヒントのタブ表示エリア（SQLEditor・MobileAnswerUI共通）
function ResultPanel({
  tab, onTabChange,
  resultCols, resultRows, sqlError, judgeRes,
  detail,
}: {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  resultCols: string[];
  resultRows: Record<string, string>[];
  sqlError: string | null;
  judgeRes: JudgeResponse | null;
  detail: ProblemDetail;
}) {
  return (
    <div style={{ flex: 1, borderTop: "1px solid #f0f0f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", background: "#f9f9f9", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
        {(["result", "expected", "hint"] as Tab[]).map((t) => (
          <div key={t} onClick={() => onTabChange(t)}
            style={{ padding: "7px 16px", fontSize: 12, cursor: "pointer", borderBottom: tab === t ? `2px solid ${C.primary}` : "2px solid transparent", color: tab === t ? C.primary : "#888", fontWeight: tab === t ? 600 : 400 }}>
            {t === "result" ? "実行結果" : t === "expected" ? "期待する結果" : "ヒント"}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {sqlError && (
          <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 8, padding: "8px 12px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>
            ⚠ {sqlError}
          </div>
        )}
        {tab === "hint" ? (
          <div style={{ fontSize: 13, color: "#555", padding: "8px 12px", background: "#fffbeb", borderRadius: 6, border: "1px solid #fde68a" }}>
            💡 {detail.problem.hint || "ヒントはありません"}
          </div>
        ) : tab === "expected" ? (
          <ResultTable columns={Object.keys(JSON.parse(detail.expected.result_json)[0] ?? {})} rows={JSON.parse(detail.expected.result_json)} />
        ) : (
          <ResultTable columns={resultCols} rows={resultRows} />
        )}
      </div>

      {/* フッター */}
      <div style={{ padding: "6px 14px", background: "#fafaf8", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, flexShrink: 0 }}>
        <span style={{ color: "#aaa" }}>{resultRows.length > 0 ? `${resultRows.length}行取得` : ""}</span>
        {judgeRes && (
          <span style={{
            background: judgeRes.is_correct ? C.success : "#dc2626",
            color: "#fff", padding: "3px 12px", borderRadius: 3, fontWeight: 600, fontSize: 12
          }}>
            {judgeRes.is_correct ? "✓ 正解！" : `✗ ${judgeRes.message}`}
          </span>
        )}
      </div>
    </div>
  );
}

// モバイル穴埋めモード。sql_template内のプレースホルダーを選択式（ドロップダウン）で埋めさせ、
// 選択が完了したら組み立てたSQL文字列を親のsql状態に反映する（採点・sql.js実行のパイプラインはSQLEditorと共通）。
type Blank = { type: "keyword" | "paren"; correct: string; options: string[] };

function MobileAnswerUI({
  problem, onSqlChange, onRun, dbLoading,
  tab, onTabChange,
  resultCols, resultRows, sqlError, judgeRes,
  detail,
  hasNextProblem, onNextProblem,
}: {
  problem: Problem;
  onSqlChange: (v: string) => void;
  onRun: () => void;
  dbLoading: boolean;
  tab: Tab;
  onTabChange: (t: Tab) => void;
  resultCols: string[];
  resultRows: Record<string, string>[];
  sqlError: string | null;
  judgeRes: JudgeResponse | null;
  detail: ProblemDetail;
  hasNextProblem?: boolean;
  onNextProblem?: () => void;
}) {
  const template = problem.sql_template ?? "";
  const blanks: Record<string, Blank> = problem.blanks ? JSON.parse(problem.blanks) : {};
  const blankIds = Object.keys(blanks);

  const [selected, setSelected] = useState<Record<string, string>>({});
  // 不正解だった直後だけ空欄の正誤ハイライトを表示する。選び直した時点でリセットする
  const [feedbackActive, setFeedbackActive] = useState(false);

  // 問題が切り替わったら選択状態をリセットする
  useEffect(() => {
    setSelected({});
    setFeedbackActive(false);
  }, [problem.id]);

  // ダミーの選択肢（INSERT/UPDATE等）はSQL構文エラーになることが多く、その場合judge APIまで
  // 到達せずsqlErrorだけが立つ。不正解の判定はjudgeRes・sqlErrorのどちらでも発火させる。
  useEffect(() => {
    if (sqlError || (judgeRes && !judgeRes.is_correct)) setFeedbackActive(true);
  }, [judgeRes, sqlError]);

  const handleSelect = (id: string, value: string) => {
    setSelected((prev) => ({ ...prev, [id]: value }));
    setFeedbackActive(false);
  };

  const isComplete = blankIds.length > 0 && blankIds.every((id) => selected[id]);
  const assembled = template.replace(/\{(\w+)\}/g, (_, id) => selected[id] ?? `{${id}}`);

  useEffect(() => {
    onSqlChange(isComplete ? assembled : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assembled, isComplete]);

  const parts = template.split(/(\{\w+\})/g);

  return (
    <>
      <div style={{ paddingBottom: 64 }}>
        <div style={{ background: "#1e1e2e", padding: "8px 14px" }}>
          <span style={{ fontSize: 11, color: "#888" }}>穴埋めモード — タップして選択</span>
        </div>
        <div style={{ background: "#1e1e2e", color: "#cdd6f4", padding: "12px 16px", fontSize: 13, fontFamily: "Courier New, monospace", lineHeight: 2.4, whiteSpace: "pre-wrap" }}>
          {parts.map((part, i) => {
            const m = part.match(/^\{(\w+)\}$/);
            const id = m?.[1];
            const blank = id ? blanks[id] : undefined;
            if (!id || !blank) return <span key={i}>{part}</span>;
            const isWrong = feedbackActive && selected[id] !== blank.correct;
            const isRight = feedbackActive && selected[id] === blank.correct;
            const borderColor = isWrong ? "#dc2626" : isRight ? "#16a34a" : selected[id] ? C.action : "#555";
            return (
              <select key={i} value={selected[id] ?? ""}
                onChange={(e) => handleSelect(id, e.target.value)}
                style={{
                  margin: "0 3px", background: selected[id] ? "#2c3350" : "#3a3f5c", color: "#fff",
                  border: `2px solid ${borderColor}`, borderRadius: 4,
                  padding: "2px 6px", fontSize: 13, fontFamily: "Courier New, monospace",
                }}>
                <option value="" disabled>?</option>
                {blank.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            );
          })}
        </div>

        <ResultPanel
          tab={tab} onTabChange={onTabChange}
          resultCols={resultCols} resultRows={resultRows} sqlError={sqlError} judgeRes={judgeRes}
          detail={detail}
        />

        <NextProblemBlock judgeRes={judgeRes} hasNextProblem={hasNextProblem} onNextProblem={onNextProblem} />
      </div>

      {/* 実行ボタン: 画面下部に固定表示し、長い問題文でもスクロールせずアクセスできるようにする */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#1e1e2e", padding: "10px 14px", borderTop: "1px solid #333", zIndex: 20 }}>
        <button onClick={onRun} disabled={dbLoading || !isComplete}
          style={{ background: dbLoading || !isComplete ? "#888" : C.action, color: "#fff", border: "none", borderRadius: 4, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: dbLoading || !isComplete ? "not-allowed" : "pointer", width: "100%" }}>
          {dbLoading ? "初期化中..." : "▶ 実行"}
        </button>
      </div>
    </>
  );
}

// モバイル穴埋めモードに対応済みの問題かどうか
function hasMobileMode(problem: Problem): boolean {
  return !!problem.sql_template && !!problem.blanks;
}

// シナリオ紹介ページ（初回表示・サイドバーの「はじめに」から表示）
function ScenarioIntro({ onStart }: { onStart: () => void }) {
  const tables = [
    { name: "customers", desc: "契約企業（顧客）マスタ" },
    { name: "plans", desc: "料金プラン" },
    { name: "subscriptions", desc: "各企業の契約状況" },
    { name: "invoices", desc: "請求データ" },
    { name: "users", desc: "サービスの利用ユーザー" },
    { name: "login_logs", desc: "ログイン履歴" },
    { name: "support_tickets", desc: "問い合わせチケット" },
    { name: "products / feature_usage", desc: "機能と利用状況" },
  ];
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.action, letterSpacing: "0.08em", marginBottom: 8 }}>SCENARIO</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.primaryDark, marginBottom: 16, lineHeight: 1.5 }}>
          ようこそ、Kufu Cloud へ。<br />あなたは今日入社した新人データアナリストです。
        </h1>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 2, marginBottom: 20 }}>
          Kufu Cloud は、中小企業向けに業務改善SaaSを提供するBtoB企業です。
          営業部・経理部・マーケティング部・カスタマーサクセス・開発部……
          社内のあらゆる部署から、あなたのもとにデータ分析の依頼が届きます。
          SQLを武器に、ひとつずつ依頼を解決しながら一人前のデータアナリストを目指しましょう。
        </p>

        <div style={{ background: C.sidebarBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 10 }}>📚 学習の流れ（全70問）</div>
          <ol style={{ fontSize: 13, color: "#555", lineHeight: 2.1, paddingLeft: 20, margin: 0 }}>
            <li><b>Lv.1〜10 SQL基礎</b> — SELECT・WHERE・ORDER BY（営業部・経理部 編）</li>
            <li><b>Lv.11〜20 集計</b> — COUNT・GROUP BY・HAVING（マーケ・CS 編）</li>
            <li><b>Lv.21〜35 JOIN</b> — テーブル結合（営業企画・PM 編）</li>
            <li><b>Lv.36〜50 分析</b> — サブクエリ・CASE・CTE（経営企画 編）</li>
            <li><b>Lv.51〜70 PostgreSQL実践</b> — Window関数など（開発部・SRE 編）</li>
          </ol>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 10 }}>🗄 Kufu Cloud のデータベース</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
            {tables.map((t) => (
              <div key={t.name} style={{ fontSize: 12.5, color: "#555", lineHeight: 1.8 }}>
                <code style={{ color: C.action, fontFamily: "Courier New, monospace" }}>{t.name}</code>
                <span style={{ color: "#888" }}> — {t.desc}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "#999", marginTop: 10 }}>
            ※ 各問題で使うテーブル定義は、問題文の下にその都度表示されます。
          </div>
        </div>

        <button onClick={onStart}
          style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Lv.1 から始める →
        </button>

        <p style={{ fontSize: 11, color: "#aaa", marginTop: 24, lineHeight: 1.7 }}>
          ※ 本サービスに登場する企業・人物・データはすべて架空のものであり、実在の企業・団体・人物とは一切関係ありません。
        </p>
      </div>
    </div>
  );
}

function ResultTable({ columns, rows }: { columns: string[]; rows: Record<string, string>[] }) {
  if (columns.length === 0) return <div style={{ color: "#aaa", fontSize: 13 }}>結果がありません</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "Courier New, monospace" }}>
      <thead>
        <tr>{columns.map((c) => <th key={c} style={{ textAlign: "left", padding: "5px 10px", background: C.sidebarBg, color: "#7a8aa3", fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf8" }}>
            {columns.map((c) => <td key={c} style={{ padding: "5px 10px", borderBottom: "1px solid #f0f0f0", color: "#555" }}>{row[c]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
