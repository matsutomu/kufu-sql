// サービス可用性の判定ロジック。トップ画面の初期ロード時に使い、
// サービス時間外・EC2停止・APIダウンのいずれかで「おやすみ画面」を表示する。
import { BASE_URL } from "./client";

export type ServiceHours = {
  timezone: string;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  note?: string;
};

export type AvailabilityResult = {
  status: "open" | "closed";
  serviceHours: ServiceHours | null;
};

const FETCH_TIMEOUT_MS = 3000;
const HEALTH_TIMEOUT_MS = 5000;

// タイムアウト付きfetch。失敗・タイムアウト時はnullを返す
async function fetchWithTimeout(url: string, timeoutMs: number, init?: RequestInit): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// EC2の起動状態（status.json、Lambdaが状態変化時に更新）を取得する。
// 失敗・タイムアウト・不正な形式のときはnullを返し、呼び出し側はヘルスチェック判定に任せる。
export async function fetchEc2Status(): Promise<string | null> {
  const res = await fetchWithTimeout("/status.json", FETCH_TIMEOUT_MS, { cache: "no-store" });
  if (!res || !res.ok) return null;
  try {
    const data = await res.json();
    return typeof data.status === "string" ? data.status : null;
  } catch {
    return null;
  }
}

export const isEc2Down = (status: string | null) => status === "stopped" || status === "stopping";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// サービス時間定義（service-hours.json、S3配信のためEC2停止中も取得できる）を取得する。
// 失敗・不正な形式のときはnullを返し、時間判定をスキップしてヘルスチェックのみで判定する
// （JSONが取れないだけでサービスを止めない）。
export async function fetchServiceHours(): Promise<ServiceHours | null> {
  const res = await fetchWithTimeout("/service-hours.json", FETCH_TIMEOUT_MS);
  if (!res || !res.ok) return null;
  try {
    const data = await res.json();
    if (typeof data.timezone !== "string" || !TIME_PATTERN.test(data.start) || !TIME_PATTERN.test(data.end)) {
      return null;
    }
    return {
      timezone: data.timezone,
      start: data.start,
      end: data.end,
      note: typeof data.note === "string" ? data.note : undefined,
    };
  } catch {
    return null;
  }
}

// 現在時刻がサービス時間内かどうか。閲覧者のタイムゾーンに依存しないよう、
// Intl.DateTimeFormatでサービス側タイムゾーンの "HH:mm" に変換して文字列比較する。
export function isWithinServiceHours(hours: ServiceHours, now: Date = new Date()): boolean {
  let hhmm: string;
  try {
    hhmm = new Intl.DateTimeFormat("en-GB", {
      timeZone: hours.timezone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
  } catch {
    // タイムゾーン名が不正な場合は時間判定をスキップし、ヘルスチェックに委ねる
    return true;
  }
  if (hours.start <= hours.end) return hours.start <= hhmm && hhmm < hours.end;
  // 日をまたぐ設定（例: 22:00〜08:00）の場合
  return hhmm >= hours.start || hhmm < hours.end;
}

// APIのヘルスチェック。タイムアウト・失敗・非200系はすべてダウン扱い
async function checkApiHealth(): Promise<boolean> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/health`, HEALTH_TIMEOUT_MS, { cache: "no-store" });
  return res?.ok ?? false;
}

// サービス可用性を判定してonResultに通知する。判定順序:
//   1. service-hours.jsonの時間判定（時間外なら即closedを通知。APIを待たないので表示が速い）
//   2. status.json（EC2がstopped/stoppingなら即closedを通知）
//   3. /api/healthのヘルスチェック（実際の可用性はこれが担保する）
// 1・2でclosedを通知した後もヘルスチェックは実行し、APIが生きていればopenで再通知する
// （JSONやstatus.jsonが古くても、実際に稼働していれば通常画面を優先する）。
export async function checkServiceAvailability(
  onResult: (result: AvailabilityResult) => void
): Promise<void> {
  const [hours, ec2Status] = await Promise.all([fetchServiceHours(), fetchEc2Status()]);
  const closedNow = (hours != null && !isWithinServiceHours(hours)) || isEc2Down(ec2Status);
  if (closedNow) onResult({ status: "closed", serviceHours: hours });

  const healthy = await checkApiHealth();
  if (healthy || !closedNow) {
    onResult({ status: healthy ? "open" : "closed", serviceHours: hours });
  }
}
