import './config'
import express, { Request, Response, NextFunction } from 'express'
import dbPgProvider from './providers/dbPgProvider'
import pgClient from './core/clients/db-pg'

;(async () => {
  await pgClient.connect()
  // Start server
})()

const app = express()
const port = 3000

// Middleware: Her isteğin Content-Type'ını JSON olarak ayarla
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json')

  next()
})

// Search endpoint
// @ts-ignore
app.get('/', async (req: Request, res: Response) => {
  try {
    let walletCount = await dbPgProvider.getWalletETHCount()

    res.json({ success: true, ...walletCount })
  } catch (error) {
    console.error('Error while searching:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
