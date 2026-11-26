import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { pool } from './db.js';
import { runMigrations } from './migrations.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(currentDir, '../dist');
let migrationRetryTimer;

app.use(express.json({ limit: '1mb' }));

const mapNote = row => ({
  id: row.id,
  title: row.title,
  content: row.content,
  contentText: row.content_text,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

app.get('/api/notes', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    const values = [];
    let where = '';

    if (query) {
      values.push(`%${query}%`);
      where = `WHERE title ILIKE $1 OR content_text ILIKE $1`;
    }

    const result = await pool.query(
      `SELECT id, title, content, content_text, created_at, updated_at
       FROM notes ${where}
       ORDER BY updated_at DESC`,
      values
    );
    res.json(result.rows.map(mapNote));
  } catch (error) {
    next(error);
  }
});

app.post('/api/notes', async (_req, res, next) => {
  try {
    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO notes (id, title)
       VALUES ($1, $2)
       RETURNING id, title, content, content_text, created_at, updated_at`,
      [id, 'Новая заметка']
    );
    res.status(201).json(mapNote(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

app.patch('/api/notes/:id', async (req, res, next) => {
  try {
    const { title, content, contentText } = req.body;
    if (title === undefined && content === undefined && contentText === undefined) {
      return res.status(400).json({ error: 'Нет полей для сохранения' });
    }
    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({ error: 'Некорректный заголовок' });
    }
    if (contentText !== undefined && typeof contentText !== 'string') {
      return res.status(400).json({ error: 'Некорректный текст заметки' });
    }
    if (content !== undefined && (typeof content !== 'object' || content === null)) {
      return res.status(400).json({ error: 'Некорректный документ Tiptap' });
    }

    const result = await pool.query(
      `UPDATE notes
       SET title = COALESCE($2, title),
           content = COALESCE($3::jsonb, content),
           content_text = COALESCE($4, content_text),
           updated_at = now()
       WHERE id = $1
       RETURNING id, title, content, content_text, created_at, updated_at`,
      [req.params.id, title ?? null, content ? JSON.stringify(content) : null, contentText ?? null]
    );

    if (!result.rowCount) return res.status(404).json({ error: 'Заметка не найдена' });
    res.json(mapNote(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/notes/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Заметка не найдена' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  if (['ECONNREFUSED', '28P01', '3D000'].includes(error.code)) {
    return res.status(503).json({ error: 'PostgreSQL недоступна или неверно настроена' });
  }
  res.status(500).json({ error: 'Ошибка сервера' });
});

async function connectDatabase() {
  clearTimeout(migrationRetryTimer);
  try {
    await runMigrations();
    console.log('PostgreSQL подключена, миграции применены');
  } catch (error) {
    console.error(`PostgreSQL пока недоступна: ${error.code || error.message}`);
    migrationRetryTimer = setTimeout(connectDatabase, 5_000);
  }
}

app.listen(port, host, () => {
  console.log(`Notes API is listening on http://${host}:${port}`);
  void connectDatabase();
});
