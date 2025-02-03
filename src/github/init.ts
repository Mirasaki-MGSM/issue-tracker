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

/**
 * Processing queue for GitHub API requests/events,
 * mapped by their ticket/issue number - not id. The reason
 * for this is that on issue create, github sends the opened event,
 * but also events for milestones, labels, etc. which are not
 * guaranteed to be in order. This way, we can queue up all events
 * for a specific issue and process them in order.
 */
const processingQueue: any[] = [];

let processingQueueInterval: NodeJS.Timeout
const initProcessingQueue = () => {
  if (processingQueueInterval) {
    clearInterval(processingQueueInterval)
  }

  processingQueueInterval = setInterval(() => {
    handleProcessingQueue()
  }, 1000)
}

const handleProcessingQueue = async () => {
  const sorted = processingQueue.sort((a, b) => {
    if (typeof a['issue'] === 'undefined' || typeof b['issue'] === 'undefined') {
      return 0
    }
    if (typeof a['issue']['number'] === 'undefined' || typeof b['issue']['number'] === 'undefined') {
      return 0
    }
    return a['issue']['number'] - b['issue']['number']
  }).sort((a, b) => {
    // Opened events should always be first
    if (a['action'] === 'opened') {
      return -1
    }
    if (b['action'] === 'opened') {
      return 1
    }

    // Closed events should always be last
    if (a['action'] === 'closed') {
      return 1
    }
    if (b['action'] === 'closed') {
      return -1
    }

    return 0;
  });

  const processPayload = async (payload: any) => {
    if ('comment' in payload) {
      switch (payload.action) {
        case 'created':
          await GithubEventHandler.instance.onIssueCommentCreated(payload)
          break;
        case 'deleted':
          await GithubEventHandler.instance.onIssueCommentDeleted(payload)
          break;
        case 'edited':
          await GithubEventHandler.instance.onIssueCommentEdited(payload)
          break;
        default:
          break;
      }
      return;
    }
  
    if ('label' in payload) {
      switch (payload.action) {
        case 'created':
          await GithubEventHandler.instance.onLabelCreated(payload)
          break;
        case 'deleted':
          await GithubEventHandler.instance.onLabelDeleted(payload)
          break;
        case 'edited':
          await GithubEventHandler.instance.onLabelEdited(payload)
          break;
        default:
          break;
      }
      return;
    }
  
    if ('issue' in payload) {
      switch (payload.action) {
        case 'assigned':
          await GithubEventHandler.instance.onIssueAssigned(payload)
          break;
        case 'closed':
          await GithubEventHandler.instance.onIssueClosed(payload)
          break;
        case 'deleted':
          await GithubEventHandler.instance.onIssueDeleted(payload)
          break;
        case 'demilestoned':
          await GithubEventHandler.instance.onIssueDemilestoned(payload)
          break;
        case 'edited':
          await GithubEventHandler.instance.onIssueEdited(payload)
          break;
        case 'labeled':
          await GithubEventHandler.instance.onIssueLabeled(payload)
          break;
        case 'locked':
          await GithubEventHandler.instance.onIssueLocked(payload)
          break;
        case 'milestoned':
          await GithubEventHandler.instance.onIssueMilestoned(payload)
          break;
        case 'opened':
          await GithubEventHandler.instance.onIssueOpened(payload)
          break;
        case 'pinned':
          await GithubEventHandler.instance.onIssuePinned(payload)
          break;
        case 'reopened':
          await GithubEventHandler.instance.onIssueReopened(payload)
          break;
        case 'transferred':
          await GithubEventHandler.instance.onIssueTransferred(payload)
          break;
        case 'unassigned':
          await GithubEventHandler.instance.onIssueUnassigned(payload)
          break;
        case 'unlabeled':
          await GithubEventHandler.instance.onIssueUnlabeled(payload)
          break;
        case 'unlocked':
          await GithubEventHandler.instance.onIssueUnlocked(payload)
          break;
        case 'unpinned':
          await GithubEventHandler.instance.onIssueUnpinned(payload)
          break;
        default:
          break;
      }
      return;
    }
  }

  for await (const payload of sorted) {
    await processPayload(payload)
  }
}

const addToProcessingQueue = (payload: unknown) => {
  // Note: Every time we add an item, we reset the interval, waiting
  // for potential new items to be added. Otherwise, we might get unlucky
  // and have the interval run just before our "opened" event is added.
  processingQueue.push(payload)
  initProcessingQueue()
}

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

    addToProcessingQueue(req.body)
  })

  app.listen(EXPRESS_PORT, () => {
    console.log(`GitHub Webhook server listening on port ${EXPRESS_PORT}`)
  })
}