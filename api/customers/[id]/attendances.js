import { initDb, db } from '../../../lib/db.js'

export default async function handler(req, res) {
  await initDb()
  const { id } = req.query
  const cid = parseInt(Array.isArray(id) ? id[0] : id, 10)
  if (!cid) {
    res.status(400).json({ error: 'ID inválido' })
    return
  }
  if (req.method === 'GET') {
    const { rows } = await db.execute({
      sql: `SELECT id, customer_id, date, service, amount, notes, created_at
            FROM attendances WHERE customer_id = ? ORDER BY date DESC, created_at DESC`,
      args: [cid]
    })
    res.status(200).json(rows)
    return
  }
  if (req.method === 'POST') {
    const { date, service, amount, notes } = req.body || {}
    if (!date || !service || amount === undefined) {
      res.status(400).json({ error: 'Campos obrigatórios: date, service, amount' })
      return
    }
    await db.execute({ sql: `SELECT id FROM customers WHERE id = ?`, args: [cid] })
    const result = await db.execute({
      sql: `INSERT INTO attendances (customer_id, date, service, amount, notes) VALUES (?, ?, ?, ?, ?)`,
      args: [cid, date, service, Number(amount), notes || null]
    })
    const idNew = result.lastInsertRowid
    const { rows } = await db.execute({ sql: `SELECT * FROM attendances WHERE id = ?`, args: [idNew] })
    res.status(201).json(rows[0])
    return
  }
  res.status(405).json({ error: 'Método não suportado' })
}
