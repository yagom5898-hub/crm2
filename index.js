import express from 'express'
import router from './routes.js'

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'API rodando no Vercel' })
})

app.use('/api', router)

export default app
