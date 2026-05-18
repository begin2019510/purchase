const express = require('express');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 数据库
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, { items: [] });

async function init() {
  await db.read();
  db.data = db.data || { items: [] };
  await db.write();
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 获取所有
app.get('/api/items', async (req, res) => {
  await db.read();
  const items = (db.data.items || []).sort((a, b) => b.createdAt - a.createdAt);
  res.json(items);
});

// 新增
app.post('/api/items', async (req, res) => {
  const { name, platform, price, qty, status, date, note } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  await db.read();
  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name, platform: platform || '拼多多', price: price || 0,
    qty: qty || 1, status: status || '待买', date: date || null,
    note: note || null, createdAt: Date.now()
  };
  db.data.items.push(item);
  await db.write();
  res.json({ id: item.id });
});

// 更新
app.put('/api/items/:id', async (req, res) => {
  await db.read();
  const idx = db.data.items.findIndex(i => i.id === req.params.id);
  if (idx < 0) return res.json({ ok: false });
  db.data.items[idx] = { ...db.data.items[idx], ...req.body };
  await db.write();
  res.json({ ok: true });
});

// 删除
app.delete('/api/items/:id', async (req, res) => {
  await db.read();
  db.data.items = db.data.items.filter(i => i.id !== req.params.id);
  await db.write();
  res.json({ ok: true });
});

// 前端
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

init().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
