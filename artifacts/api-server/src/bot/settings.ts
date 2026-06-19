import { pool } from "@workspace/db";
import { PLANS } from "./config";

export async function getSetting(key: string): Promise<string | null> {
  try {
    const res = await pool.query<{ value: string }>(
      "SELECT value FROM settings WHERE key = $1", [key],
    );
    return res.rows[0]?.value ?? null;
  } catch { return null; }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value],
  );
}

export async function deleteSetting(key: string): Promise<void> {
  await pool.query("DELETE FROM settings WHERE key = $1", [key]);
}

export async function getAllSettings(prefix: string): Promise<{ key: string; value: string }[]> {
  try {
    const res = await pool.query<{ key: string; value: string }>(
      "SELECT key, value FROM settings WHERE key LIKE $1 ORDER BY key",
      [`${prefix}%`],
    );
    return res.rows;
  } catch { return []; }
}

export async function getEffectivePrice(planId: string): Promise<number> {
  const override = await getSetting(`plan_price:${planId}`);
  if (override !== null) return parseFloat(override);
  return PLANS.find((p) => p.id === planId)?.price ?? 0;
}

export async function isMaintenanceMode(): Promise<boolean> {
  return (await getSetting("maintenance_mode")) === "true";
}

export async function getWelcomeMessage(): Promise<string | null> {
  return getSetting("welcome_message");
}

export async function getBlacklist(): Promise<string[]> {
  const raw = await getSetting("blacklist");
  if (!raw) return [];
  return raw.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
}
