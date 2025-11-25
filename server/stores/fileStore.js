// server/stores/fileStore.js
import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR } from '../config.js';

async function ensureDataDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch (e) {}
}

async function readJson(filename, fallback) {
  await ensureDataDir();
  const p = path.join(DATA_DIR, filename);
  try {
    const text = await fs.readFile(p, 'utf8');
    return JSON.parse(text);
  } catch (e) {
    return fallback;
  }
}

async function writeJson(filename, obj) {
  await ensureDataDir();
  const p = path.join(DATA_DIR, filename);
  await fs.writeFile(p, JSON.stringify(obj, null, 2), 'utf8');
}

export const ApiSettingsStore = {
  file: 'api-settings.json',
  async getSettings() {
    return (await readJson(this.file, { apis: [] }));
  },
  async saveSettings(settings) {
    await writeJson(this.file, settings);
    return settings;
  },
};

export const SessionsStore = {
  file: 'sessions.json',
  async listSessions() {
    return (await readJson(this.file, { sessions: [] })).sessions;
  },
  async saveSessions(sessions) {
    await writeJson(this.file, { sessions });
    return sessions;
  },
  async getSession(id) {
    const data = await readJson(this.file, { sessions: [] });
    return data.sessions.find(s => s.id === id) || null;
  },
  async saveSession(session) {
    const data = await readJson(this.file, { sessions: [] });
    const idx = data.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) data.sessions[idx] = session;
    else data.sessions.push(session);
    await writeJson(this.file, data);
    return session;
  },
  async deleteSession(id) {
    const data = await readJson(this.file, { sessions: [] });
    data.sessions = data.sessions.filter(s => s.id !== id);
    await writeJson(this.file, data);
    return true;
  }
};

export const FilesStore = {
  file: 'files.json',
  async listFiles() {
    return (await readJson(this.file, []) );
  },
  async addFile(meta) {
    const arr = await readJson(this.file, []);
    arr.push(meta);
    await writeJson(this.file, arr);
    return meta;
  }
};
