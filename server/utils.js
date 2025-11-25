// server/utils.js
import fs from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR } from './config.js';

export async function ensureUploadDir() {
  try { await fs.mkdir(UPLOAD_DIR, { recursive: true }); } catch (e) {}
}

export function makeId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

export function nowIso() {
  return new Date().toISOString();
}
