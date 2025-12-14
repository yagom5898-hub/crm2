import { initDb, db } from '../../lib/db.js'

export default async function handler(req, res) {
  await initDb()
  if (req.method === 'GET') {
    const q = (req.query.q || '').trim()
    if (q) {
      const like = `%${q}%`
      const { rows } = await db.execute({
        sql: `SELECT id, name, phone, email, service_main, notes, created_at
              FROM customers
              WHERE name LIKE ? OR phone LIKE ?
              ORDER BY created_at DESC`,
        args: [like, like]
      })
      res.status(200).json(rows)
      return
    }
    const { rows } = await db.execute(`SELECT id, name, phone, email, service_main, notes, created_at FROM customers ORDER BY created_at DESC`)
    res.status(200).json(rows)
    return
  }
  if (req.method === 'POST') {
    const { name, phone, email, service_main, notes } = req.body || {}
    if (!name || !phone || !service_main) {
      res.status(400).json({ error: 'Campos obrigatórios: name, phone, service_main' })
      return
    }
    const result = await db.execute({
      sql: `INSERT INTO customers (name, phone, email, service_main, notes) VALUES (?, ?, ?, ?, ?)`,
      args: [name, phone, email || null, service_main, notes || null]
    })
    const id = result.lastInsertRowid
    const { rows } = await db.execute({ sql: `SELECT * FROM customers WHERE id = ?`, args: [id] })
    res.status(201).json(rows[0])
    return
  }
  res.status(405).json({ error: 'Método não suportado' })
}
