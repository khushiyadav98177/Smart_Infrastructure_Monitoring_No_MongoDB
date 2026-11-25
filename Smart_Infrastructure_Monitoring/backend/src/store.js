import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const dataDir = path.resolve("data");
const dataFile = path.join(dataDir, "store.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try { await fs.access(dataFile); }
  catch { await fs.writeFile(dataFile, JSON.stringify({ users: [], issues: [] }, null, 2)); }
}
export async function readStore() {
  await ensureStore();
  try {
    const data = JSON.parse(await fs.readFile(dataFile, "utf8"));
    return { users: Array.isArray(data.users) ? data.users : [], issues: Array.isArray(data.issues) ? data.issues : [] };
  } catch {
    throw new Error('backend/data/store.json is invalid. Restore a backup or reset it to {"users":[],"issues":[]}');
  }
}
export async function writeStore(data) {
  await ensureStore();
  const temp = `${dataFile}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2));
  await fs.rename(temp, dataFile);
}
export const newId = () => randomUUID();
export const now = () => new Date().toISOString();
