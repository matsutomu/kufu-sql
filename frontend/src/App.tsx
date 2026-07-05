import { useState, useEffect, useCallback } from "react";
import { fetchProblems, fetchProblemDetail, judge } from "./api/client";
import type { Problem, ProblemDetail, JudgeResponse } from "./api/client";
import { useSqlJs } from "./hooks/useSqlJs";
import "./index.css";

const SESSION_ID = (() => {
  const key = "kufu_session_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
})();

type Tab = "result" | "expected" | "hint";

const CATEGORIES: Record<number, string> = {
  1: "SELECT 基礎",
  2: "集計・グループ化",
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

  const { loading: dbLoading, execute } = useSqlJs(
    detail?.schema.ddl ?? "",
    detail?.schema.seed_data ?? ""
  );

  useEffect(() => {
    fetchProblems().then(setProblems).catch(console.error);
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
      judge(detail.problem.id, SESSION_ID, rows).then((res) => {
        setJudgeRes(res);
        if (res.is_correct) setSolvedIds((prev) => new Set([...prev, detail.problem.id]));
      });
    } catch (e: any) {
      setSqlError(e.message);
      setResultRows([]);
      setResultCols([]);
    }
  }, [execute, sql, detail]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif" }}>
      {/* ヘッダー */}
      <div style={{ background: "#1a1a1a", color: "#fff", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>kufu<span style={{ color: "#f59e0b" }}>:SQL</span></span>
        <span style={{ fontSize: 11, color: "#888", marginLeft: 4 }}>工夫</span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* サイドバー */}
        <div style={{ width: 230, background: "#f5f3ee", borderRight: "1px solid #e5e5e5", overflowY: "auto", padding: "12px 10px", flexShrink: 0 }}>

          {/* 進捗バー */}
          <div style={{ marginBottom: 14, padding: "10px 10px", background: "#fff", borderRadius: 8, border: "1px solid #e5e5e5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 5 }}>
              <span>進捗</span>
              <span>{solvedCount} / {totalCount} 完了</span>
            </div>
            <div style={{ height: 5, background: "#e5e5e5", borderRadius: 99 }}>
              <div style={{ height: 5, background: "#4a7c59", borderRadius: 99, width: `${progressPct}%`, transition: "width 0.3s" }} />
            </div>
          </div>

          {/* カテゴリ別問題一覧 */}
          {Object.entries(grouped).map(([catId, probs]) => (
            <div key={catId} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5, paddingLeft: 4 }}>
                {CATEGORIES[Number(catId)] ?? `カテゴリ${catId}`}
              </div>
              {probs.map((p) => (
                <div key={p.id}
                  onClick={() => setSelected(p.id)}
                  style={{
                    padding: "7px 10px", borderRadius: 6, marginBottom: 2, cursor: "pointer", fontSize: 13,
                    background: selected === p.id ? "#4a7c59" : "transparent",
                    color: selected === p.id ? "#fff" : "#555",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  <span style={{ fontSize: 12, color: selected === p.id ? "#fff" : solvedIds.has(p.id) ? "#4a7c59" : "#ccc" }}>
                    {solvedIds.has(p.id) ? "✓" : "○"}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.4 }}>{p.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* メインパネル */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!detail ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 14 }}>
              左のリストから問題を選んでください
            </div>
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

              {/* エディタ */}
              <div style={{ background: "#1e1e2e", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#888" }}>SQL Editor — sql.js (SQLite)</span>
                <button onClick={handleRun} disabled={dbLoading}
                  style={{ background: dbLoading ? "#888" : "#f59e0b", color: "#fff", border: "none", borderRadius: 4, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: dbLoading ? "not-allowed" : "pointer" }}>
                  {dbLoading ? "初期化中..." : "▶ 実行"}
                </button>
              </div>
              <textarea value={sql} onChange={(e) => setSql(e.target.value)}
                placeholder="SELECT * FROM employees;"
                style={{ background: "#1e1e2e", color: "#cdd6f4", border: "none", outline: "none", padding: "12px 16px", fontSize: 13, fontFamily: "Courier New, monospace", resize: "none", minHeight: 110, lineHeight: 1.7, flexShrink: 0 }}
              />

              {/* 結果エリア */}
              <div style={{ flex: 1, borderTop: "1px solid #f0f0f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ display: "flex", background: "#f9f9f9", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
                  {(["result", "expected", "hint"] as Tab[]).map((t) => (
                    <div key={t} onClick={() => setTab(t)}
                      style={{ padding: "7px 16px", fontSize: 12, cursor: "pointer", borderBottom: tab === t ? "2px solid #4a7c59" : "2px solid transparent", color: tab === t ? "#4a7c59" : "#888", fontWeight: tab === t ? 600 : 400 }}>
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
                      background: judgeRes.is_correct ? "#4a7c59" : "#dc2626",
                      color: "#fff", padding: "3px 12px", borderRadius: 3, fontWeight: 600, fontSize: 12
                    }}>
                      {judgeRes.is_correct ? "✓ 正解！" : `✗ ${judgeRes.message}`}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultTable({ columns, rows }: { columns: string[]; rows: Record<string, string>[] }) {
  if (columns.length === 0) return <div style={{ color: "#aaa", fontSize: 13 }}>結果がありません</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "Courier New, monospace" }}>
      <thead>
        <tr>{columns.map((c) => <th key={c} style={{ textAlign: "left", padding: "5px 10px", background: "#f5f3ee", color: "#888", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #e5e5e5" }}>{c}</th>)}</tr>
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
