import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import type { Database } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// 根目录 = 当前文件往上退一层
const ROOT = join(__dirname, '..');
let db: Database<sqlite3.Database, sqlite3.Statement>;

/* 连接池 */
async function getDB() {
  if (!db) {
    db = await open({
      filename: join(ROOT, 'public/data.sqlite'),
      driver: sqlite3.Database
    });
  }
  return db;
}

/* ---------- 增 ---------- */
export async function insertWord(
  word: string,
  tag: string,
  pos: string,
  meaning: string,
  audio?: string,
  is_collected = 0
) {
  const conn = await getDB();
  const res = await conn.run(
    `INSERT INTO word(word, tag, pos, meaning, audio, is_collected)
     VALUES (?, ?, ?, ?, ?, ?)`,
    word, tag, pos, meaning, audio ?? null, is_collected
  );
  return res.lastID; // 返回新主键
}

/* ---------- 删 ---------- */
export async function deleteWord(id: number) {
  const conn = await getDB();
  const res = await conn.run('DELETE FROM word WHERE id = ?', id);
  return res.changes; // 影响行数
}

/* ---------- 改 ---------- */
export async function updateWord(
  id: number,
  updates: Partial<Omit<Word, 'id'>>
) {
  const sets: string[] = [];
  const values: any[] = [];
  for (const [k, v] of Object.entries(updates)) {
    sets.push(`${k} = ?`);
    values.push(v);
  }
  if (!sets.length) throw new Error('无更新字段');
  values.push(id);
  const conn = await getDB();
  const res = await conn.run(
    `UPDATE word SET ${sets.join(', ')} WHERE id = ?`,
    ...values
  );
  return res.changes;
}

/* ---------- 查 ---------- */
export async function getWord(id : String) {
  const conn = await getDB();
  return conn.all<Word>(id);
}
/* ---------- 类型 ---------- */
export interface Word {
  id: number;
  word: string;
  tag: string | null;
  pos: string | null;
  meaning: string;
  audio: string | null;
  is_collected: number;
}

/* ---------- CLI 演示 
if (require.main === module) {
  (async () => {
    // 示例：增
    const id = await insertWord('apple', 'fruit', 'n.', '苹果');
    console.log('新增 id =', id);

    // 查
    console.log(await getWord(id));

    // 改
    await updateWord(id, { is_collected: 1 });
    console.log('更新后', await getWord(id));

    // 列表
    console.table(await listWords({ tag: 'fruit' }));

    // 删
    await deleteWord(id);
    console.log('已删除');

    process.exit(0);
  })();
}---------- */