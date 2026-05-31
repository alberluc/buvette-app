import express from 'express'
import licensesRouter from './routes/licenses.js'
import authRouter from './routes/auth.js'
import accountsRouter from './routes/accounts.js'
import daysRouter from './routes/days.js'
import productsRouter from './routes/products.js'
import settingsRouter from './routes/settings.js'
import adminRouter from './routes/admin.js'
import { startMonthlyReportJob } from './jobs/monthlyReport.js'
import demoRouter from './routes/demo.js'
import reportsRouter from './routes/reports.js'

if (!process.env.JWT_SECRET || !process.env.ADMIN_SECRET) {
  console.error('JWT_SECRET et ADMIN_SECRET sont requis')
  process.exit(1)
}

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  const origin = req.headers.origin
  const allowed = [
    'https://buvette.petanquedutelegraphe.fr',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
  ]
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Admin-Secret,Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.get('/', (req, res) => res.json({ ok: true, service: 'buvette-api' }))

app.use('/', licensesRouter)
app.use('/', authRouter)
app.use('/', accountsRouter)
app.use('/', daysRouter)
app.use('/', productsRouter)
app.use('/', settingsRouter)
app.use('/admin', adminRouter)
app.use('/', demoRouter)
app.use('/', reportsRouter)

app.listen(3000, () => {
  console.log('API buvette démarrée sur :3000')
  startMonthlyReportJob()
})
