import Express from 'express'
import bodyParser from 'body-parser'
import { parsedEnv } from '../env.js'
import crypto from 'crypto'
import { GithubEventHandler } from './handler.js'
import { Octokit } from '@octokit/core'
import { createAppAuth } from '@octokit/auth-app'

const { 
  EXPRESS_PORT,
  GITHUB_APP_ID,
  GITHUB_APP_PRIVATE_KEY,
  GITHUB_APP_INSTALLATION_ID,
  GITHUB_REPO_NAME,
  GITHUB_REPO_OWNER,
  GITHUB_WEBHOOK_SECRET,
 } = parsedEnv

export const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: GITHUB_APP_ID,
    privateKey: GITHUB_APP_PRIVATE_KEY,
    installationId: GITHUB_APP_INSTALLATION_ID,
  }
})

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

    res.status(200).end()

    if (req.body.repository) {
      if (req.body.repository.name !== GITHUB_REPO_NAME || req.body.repository.owner.login !== GITHUB_REPO_OWNER) {
        console.warn('GitHub Webhook received for different repository - ignoring.')
        return;
      }
    }

    if ('comment' in req.body) {
      switch (req.body.action) {
        case 'created':
          GithubEventHandler.instance.onIssueCommentCreated(req.body)
          break;
        case 'deleted':
          GithubEventHandler.instance.onIssueCommentDeleted(req.body)
          break;
        case 'edited':
          GithubEventHandler.instance.onIssueCommentEdited(req.body)
          break;
        default:
          break;
      }
      return;
    }

    if ('label' in req.body) {
      switch (req.body.action) {
        case 'created':
          GithubEventHandler.instance.onLabelCreated(req.body)
          break;
        case 'deleted':
          GithubEventHandler.instance.onLabelDeleted(req.body)
          break;
        case 'edited':
          GithubEventHandler.instance.onLabelEdited(req.body)
          break;
        default:
          break;
      }
      return;
    }

    if ('issue' in req.body) {
      switch (req.body.action) {
        case 'assigned':
          GithubEventHandler.instance.onIssueAssigned(req.body)
          break;
        case 'closed':
          GithubEventHandler.instance.onIssueClosed(req.body)
          break;
        case 'deleted':
          GithubEventHandler.instance.onIssueDeleted(req.body)
          break;
        case 'demilestoned':
          GithubEventHandler.instance.onIssueDemilestoned(req.body)
          break;
        case 'edited':
          GithubEventHandler.instance.onIssueEdited(req.body)
          break;
        case 'labeled':
          GithubEventHandler.instance.onIssueLabeled(req.body)
          break;
        case 'locked':
          GithubEventHandler.instance.onIssueLocked(req.body)
          break;
        case 'milestoned':
          GithubEventHandler.instance.onIssueMilestoned(req.body)
          break;
        case 'opened':
          GithubEventHandler.instance.onIssueOpened(req.body)
          break;
        case 'pinned':
          GithubEventHandler.instance.onIssuePinned(req.body)
          break;
        case 'reopened':
          GithubEventHandler.instance.onIssueReopened(req.body)
          break;
        case 'transferred':
          GithubEventHandler.instance.onIssueTransferred(req.body)
          break;
        case 'unassigned':
          GithubEventHandler.instance.onIssueUnassigned(req.body)
          break;
        case 'unlabeled':
          GithubEventHandler.instance.onIssueUnlabeled(req.body)
          break;
        case 'unlocked':
          GithubEventHandler.instance.onIssueUnlocked(req.body)
          break;
        case 'unpinned':
          GithubEventHandler.instance.onIssueUnpinned(req.body)
          break;
        default:
          break;
      }
      return;
    }
  })

  app.listen(EXPRESS_PORT, () => {
    console.log(`GitHub Webhook server listening on port ${EXPRESS_PORT}`)
  })
}