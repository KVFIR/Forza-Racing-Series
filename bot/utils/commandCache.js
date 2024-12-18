import fs from 'fs/promises';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'command-cache.json');

export async function saveCommandCache(commands) {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(commands, null, 2));
  } catch (error) {
    console.error('Failed to save command cache:', error);
  }
}

export async function loadCommandCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
} 