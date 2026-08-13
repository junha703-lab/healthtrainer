export type AccountSession = { token: string; name: string; state?: Record<string, unknown> };

const SUPABASE_URL = "https://occckuxwchyeuaxprukp.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_guRSQxcT3aMDqywoodMGPA_BR_QSW3y";

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.");
  return response.json() as Promise<T>;
}

export async function loginAccount(name: string, pin: string) {
  return rpc<{ ok: boolean; token?: string; name?: string; created?: boolean; state?: Record<string, unknown>; error?: string }>("app_login", { p_name: name, p_pin: pin });
}

export async function loadAccount(token: string) {
  return rpc<{ ok: boolean; name?: string; state?: Record<string, unknown>; error?: string }>("app_load_state", { p_token: token });
}

export async function saveAccount(token: string, state: Record<string, unknown>) {
  return rpc<{ ok: boolean }>("app_save_state", { p_token: token, p_state: state });
}

export async function logoutAccount(token: string) {
  return rpc<{ ok: boolean }>("app_logout", { p_token: token });
}
