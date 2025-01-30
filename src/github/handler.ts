import { DiscordHandler } from '../discord/handler.js';
import { parsedEnv } from '../env.js';
import type {
  IssueAssignedPayload,
  IssueClosedPayload,
  IssueCommentCreatedPayload,
  IssueCommentDeletedPayload,
  IssueCommentEditedPayload,
  IssueDeletedPayload,
  IssueDemilestonedPayload,
  IssueEditedPayload,
  IssueLabeledPayload,
  IssueLockedPayload,
  IssueMilestonedPayload,
  IssueOpenedPayload,
  IssuePinnedPayload,
  IssueReopenedPayload,
  IssueTransferredPayload,
  IssueUnassignedPayload,
  IssueUnlabeledPayload,
  IssueUnlockedPayload,
  IssueUnpinnedPayload,
  LabelCreatedPayload,
  LabelDeletedPayload,
  LabelEditedPayload,
  User
} from '../types.js';

const {
  GITHUB_APP_ID
} = parsedEnv;

export class GithubEventHandler {
  private static _instance: GithubEventHandler;
  public static get instance(): GithubEventHandler {
    if (!this._instance) {
      this._instance = new GithubEventHandler();
    }

    return this._instance;
  }

  private constructor() {}

  private static appId: number = parseInt(GITHUB_APP_ID);
  private static isAppUser(user: User): boolean {
    return user.type === 'Bot' && user.id === this.appId;
  }

  // 
  // Start Comments
  // 

  public async onIssueCommentCreated(payload: IssueCommentCreatedPayload) {
    console.log(`Comment created: ${payload.comment.body}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Comment created by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueCommentCreated(payload);
  }

  public async onIssueCommentDeleted(payload: IssueCommentDeletedPayload) {
    console.log(`Comment deleted: ${payload.comment.body}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Comment deleted by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueCommentDeleted(payload);
  }

  public async onIssueCommentEdited(payload: IssueCommentEditedPayload) {
    console.log(`Comment edited: ${payload.comment.body}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Comment edited by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueCommentEdited(payload);
  }

  // 
  // Start Labels
  // 

  public async onLabelCreated(payload: LabelCreatedPayload) {
    console.log(`Label created: ${payload.label.name}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Label created by bot, ignoring.`);
      return;
    }
    DiscordHandler.onLabelCreated(payload);
  }

  public async onLabelDeleted(payload: LabelDeletedPayload) {
    console.log(`Label deleted: ${payload.label.name}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Label deleted by bot, ignoring.`);
      return;
    }
    DiscordHandler.onLabelDeleted(payload);
  }

  public async onLabelEdited(payload: LabelEditedPayload) {
    console.log(`Label edited: ${payload.label.name}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Label edited by bot, ignoring.`);
      return;
    }
    DiscordHandler.onLabelEdited(payload);
  }

  // 
  // Start Issues
  // 

  public async onIssueAssigned(payload: IssueAssignedPayload) {
    console.log(`Issue assigned: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue assigned by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueAssigned(payload);
  }

  public async onIssueClosed(payload: IssueClosedPayload) {
    console.log(`Issue closed: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue closed by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueClosed(payload);
  }

  public async onIssueDeleted(payload: IssueDeletedPayload) {
    console.log(`Issue deleted: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue deleted by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueDeleted(payload);
  }

  public async onIssueDemilestoned(payload: IssueDemilestonedPayload) {
    console.log(`Issue demilestoned: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue demilestoned by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueDemilestoned(payload);
  }

  public async onIssueEdited(payload: IssueEditedPayload) {
    console.log(`Issue edited: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue edited by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueEdited(payload);
  }

  public async onIssueLabeled(payload: IssueLabeledPayload) {
    console.log(`Issue labeled: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue labeled by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueLabeled(payload);
  }

  public async onIssueLocked(payload: IssueLockedPayload) {
    console.log(`Issue locked: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue locked by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueLocked(payload);
  }

  public async onIssueMilestoned(payload: IssueMilestonedPayload) {
    console.log(`Issue milestoned: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue milestoned by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueMilestoned(payload);
  }

  public async onIssueOpened(payload: IssueOpenedPayload) {
    console.log(`Issue opened: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue opened by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueOpened(payload);
  }

  public async onIssuePinned(payload: IssuePinnedPayload) {
    console.log(`Issue pinned: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue pinned by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssuePinned(payload);
  }

  public async onIssueReopened(payload: IssueReopenedPayload) {
    console.log(`Issue reopened: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue reopened by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueReopened(payload);
  }

  public async onIssueTransferred(payload: IssueTransferredPayload) {
    console.log(`Issue transferred: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue transferred by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueTransferred(payload);
  }

  public async onIssueUnassigned(payload: IssueUnassignedPayload) {
    console.log(`Issue unassigned: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue unassigned by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueUnassigned(payload);
  }

  public async onIssueUnlabeled(payload: IssueUnlabeledPayload) {
    console.log(`Issue unlabeled: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue unlabeled by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueUnlabeled(payload);
  }

  public async onIssueUnlocked(payload: IssueUnlockedPayload) {
    console.log(`Issue unlocked: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue unlocked by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueUnlocked(payload);
  }

  public async onIssueUnpinned(payload: IssueUnpinnedPayload) {
    console.log(`Issue unpinned: ${payload.issue.title}`);
    if (GithubEventHandler.isAppUser(payload.sender)) {
      console.log(`Issue unpinned by bot, ignoring.`);
      return;
    }
    DiscordHandler.onIssueUnpinned(payload);
  }
}