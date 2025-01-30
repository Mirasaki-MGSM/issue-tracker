import Express from 'express'
import bodyParser from 'body-parser'
import { parsedEnv } from '../env'
import crypto from 'crypto'

const {
  EXPRESS_PORT,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_REPO_NAME,
  GITHUB_REPO_OWNER,
  GITHUB_WEBHOOK_SECRET,
} = parsedEnv

export const initGitHub = () => {
  const app = Express()
  
  app.use(bodyParser.json({ limit: '5mb' }))
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use((_req, res, next) => {
    res.setHeader('Content-Type', 'application/json')
    next()
  })

  app.post('/webhooks/github', (req, res) => {
    const signature = req.get('X-Hub-Signature')
    const event = req.get('X-GitHub-Event')
    const id = req.get('X-GitHub-Delivery')

    const valid = [signature, event, id].every(Boolean)

    if (!valid) {
      console.error('GitHub Webhook received without required headers.')
      res.status(400).send({ message: 'Missing required headers.' })
      return;
    }

    const payload = JSON.stringify(req.body)
    const secret = GITHUB_WEBHOOK_SECRET
    const hash = crypto.createHmac('sha1', secret)
      .update(payload)
      .digest('hex')
    const hashExpected = `sha1=${hash}`
    const hashReceived = signature

    const match = crypto.timingSafeEqual(
      Buffer.from(hashExpected),
      Buffer.from(hashReceived!),
    )

    if (!match) {
      console.error('GitHub Webhook received with invalid signature.')
      res.status(400).send({ message: 'Invalid signature.' })
      return;
    }

    console.log('GitHub Webhook received:', req.body)
    res.send({ message: 'Received' })
  })

  app.listen(EXPRESS_PORT, () => {
    console.log(`GitHub Webhook server listening on port ${EXPRESS_PORT}`)
  })
}