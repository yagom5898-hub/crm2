import { initDb, db } from '../../lib/db.js'

export default async function handler(req, res) {
  await initDb()
  const { id } = req.query
  const aid = parseInt(Array.isArray(id) ? id[0] : id, 10)
  if (!aid) {
    res.status(400).json({ error: 'ID inválido' })
    return
  }
  if (req.method === 'PUT') {
    const { date, service, amount, notes } = req.body || {}
    await db.execute({
      sql: `UPDATE attendances SET date = ?, service = ?, amount = ?, notes = ? WHERE id = ?`,
      args: [date, service, Number(amount), notes || null, aid]
    })
    const { rows } = await db.execute({ sql: `SELECT * FROM attendances WHERE id = ?`, args: [aid] })
    res.status(200).json(rows[0])
    return
  }
  if (req.method === 'DELETE') {
    await db.execute({ sql: `DELETE FROM attendances WHERE id = ?`, args: [aid] })
    res.status(204).end()
    return
  }
  res.status(405).json({ error: 'Método não suportado' })
}
