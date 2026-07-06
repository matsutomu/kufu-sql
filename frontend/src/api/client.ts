const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export type Problem = {
  id: number;
  category_id: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  hint: string;
  sort_order: number;
};

export type ProblemDetail = {
  problem: Problem;
  schema: { ddl: string; seed_data: string };
  expected: { answer_sql: string; result_json: string };
};

export type JudgeResponse = {
  is_correct: boolean;
  message: string;
  hint?: string;
};

export type ProgressItem = {
  problem_id: number;
  is_correct: boolean;
  attempts: number;
};

export async function fetchProblems(): Promise<Problem[]> {
  const res = await fetch(`${BASE_URL}/api/problems`);
  if (!res.ok) throw new Error("問題一覧の取得に失敗しました");
  return res.json();
}

export async function fetchProblemDetail(id: number): Promise<ProblemDetail> {
  const res = await fetch(`${BASE_URL}/api/problems/${id}`);
  if (!res.ok) throw new Error("問題詳細の取得に失敗しました");
  return res.json();
}

export async function judge(
  problemId: number,
  sessionId: string,
  resultRows: Record<string, string>[]
): Promise<JudgeResponse> {
  const res = await fetch(`${BASE_URL}/api/judge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problem_id: problemId,
      session_id: sessionId,
      result_rows: resultRows,
    }),
  });
  if (!res.ok) throw new Error("採点に失敗しました");
  return res.json();
}

export async function fetchProgress(sessionId: string): Promise<ProgressItem[]> {
  const res = await fetch(`${BASE_URL}/api/progress?session_id=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error("進捗の取得に失敗しました");
  return res.json();
}
