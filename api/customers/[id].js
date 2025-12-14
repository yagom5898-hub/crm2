import { initDb, db } from '../../lib/db.js'

export default async function handler(req, res) {
  await initDb()
  const { id } = req.query
  const cid = parseInt(Array.isArray(id) ? id[0] : id, 10)
  if (!cid) {
    res.status(400).json({ error: 'ID inválido' })
    return
  }
  if (req.method === 'GET') {
    const { rows } = await db.execute({ sql: `SELECT * FROM customers WHERE id = ?`, args: [cid] })
    if (!rows.length) {
      res.status(404).json({ error: 'Cliente não encontrado' })
      return
    }
    res.status(200).json(rows[0])
    return
  }
  if (req.method === 'PUT') {
    const { name, phone, email, service_main, notes } = req.body || {}
    const { rows: exists } = await db.execute({ sql: `SELECT id FROM customers WHERE id = ?`, args: [cid] })
    if (!exists.length) {
      res.status(404).json({ error: 'Cliente não encontrado' })
      return
    }
    await db.execute({
      sql: `UPDATE customers SET name = ?, phone = ?, email = ?, service_main = ?, notes = ? WHERE id = ?`,
      args: [name, phone, email || null, service_main, notes || null, cid]
    })
    const { rows } = await db.execute({ sql: `SELECT * FROM customers WHERE id = ?`, args: [cid] })
    res.status(200).json(rows[0])
    return
  }
  if (req.method === 'DELETE') {
    await db.execute({ sql: `DELETE FROM customers WHERE id = ?`, args: [cid] })
    res.status(204).end()
    return
  }
  res.status(405).json({ error: 'Método não suportado' })
}
