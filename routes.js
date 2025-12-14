import { Router } from 'express'
import { db, initSchema } from './db.js'

const router = Router()

router.use(async (req, res, next) => {
  await initSchema()
  next()
})

router.get('/customers', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (q) {
    const like = `%${q}%`
    const { rows } = await db.execute({
      sql: `SELECT id, name, phone, email, service_main, notes, created_at
            FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY created_at DESC`,
      args: [like, like]
    })
    res.json(rows)
    return
  }
  const { rows } = await db.execute(`SELECT id, name, phone, email, service_main, notes, created_at FROM customers ORDER BY created_at DESC`)
  res.json(rows)
})

router.post('/customers', async (req, res) => {
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
})

router.get('/customers/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { rows } = await db.execute({ sql: `SELECT * FROM customers WHERE id = ?`, args: [id] })
  if (!rows.length) {
    res.status(404).json({ error: 'Cliente não encontrado' })
    return
  }
  res.json(rows[0])
})

router.put('/customers/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { name, phone, email, service_main, notes } = req.body || {}
  await db.execute({
    sql: `UPDATE customers SET name = ?, phone = ?, email = ?, service_main = ?, notes = ? WHERE id = ?`,
    args: [name, phone, email || null, service_main, notes || null, id]
  })
  const { rows } = await db.execute({ sql: `SELECT * FROM customers WHERE id = ?`, args: [id] })
  res.json(rows[0])
})

router.delete('/customers/:id', async (req, res) => {
  const id = Number(req.params.id)
  await db.execute({ sql: `DELETE FROM customers WHERE id = ?`, args: [id] })
  res.status(204).end()
})

router.get('/customers/:id/attendances', async (req, res) => {
  const id = Number(req.params.id)
  const { rows } = await db.execute({
    sql: `SELECT id, customer_id, date, service, amount, notes, created_at FROM attendances WHERE customer_id = ? ORDER BY date DESC, created_at DESC`,
    args: [id]
  })
  res.json(rows)
})

router.post('/customers/:id/attendances', async (req, res) => {
  const id = Number(req.params.id)
  const { date, service, amount, notes } = req.body || {}
  if (!date || !service || amount === undefined) {
    res.status(400).json({ error: 'Campos obrigatórios: date, service, amount' })
    return
  }
  const result = await db.execute({
    sql: `INSERT INTO attendances (customer_id, date, service, amount, notes) VALUES (?, ?, ?, ?, ?)`,
    args: [id, date, service, Number(amount), notes || null]
  })
  const aid = result.lastInsertRowid
  const { rows } = await db.execute({ sql: `SELECT * FROM attendances WHERE id = ?`, args: [aid] })
  res.status(201).json(rows[0])
})

router.put('/attendances/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { date, service, amount, notes } = req.body || {}
  await db.execute({
    sql: `UPDATE attendances SET date = ?, service = ?, amount = ?, notes = ? WHERE id = ?`,
    args: [date, service, Number(amount), notes || null, id]
  })
  const { rows } = await db.execute({ sql: `SELECT * FROM attendances WHERE id = ?`, args: [id] })
  res.json(rows[0])
})

router.delete('/attendances/:id', async (req, res) => {
  const id = Number(req.params.id)
  await db.execute({ sql: `DELETE FROM attendances WHERE id = ?`, args: [id] })
  res.status(204).end()
})

export default router
