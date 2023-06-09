/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/first */
import dotenv from 'dotenv'
dotenv.config()

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { mintAndTransfer } from './providers/web3Provider'

const PORT: number = parseInt(`${process.env.PORT || 3001}`)

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN }))

app.use(helmet())

app.use(morgan('tiny'))

const nextMint = new Map<string, number>()

app.post(
  '/mint/:wallet',
  async (req: Request, res: Response, next: NextFunction) => {
    const wallet = req.params.wallet
    const oneDayInMilliseconds = Date.now() + 1000 * 60 * 60 * 24

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (nextMint.has(wallet) && nextMint.get(wallet)! > Date.now())
      return res
        .status(400)
        .json('Minting is not available yet! Try again tomorrow.')

    try {
      const tx = await mintAndTransfer(wallet)
      res.json(tx)
    } catch (error: any) {
      console.error(error)
      if (
        error.message &&
        error.message.includes('Minting is not available yet')
      )
        res.status(400).json(error.message)
      else res.status(500).json(error.message)
    }

    nextMint.set(wallet, oneDayInMilliseconds)
  },
)

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
