// server/config.js
export const ENABLE_AUTH = false; // toggle to true later to enable auth checks
export const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
export const DATA_DIR = new URL('./data/', import.meta.url).pathname;
export const UPLOAD_DIR = new URL('./public/uploads/', import.meta.url).pathname;
