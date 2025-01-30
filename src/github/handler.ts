import { DiscordHandler } from '../discord/handler.js';
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
  LabelEditedPayload
} from '../types.js';

export class GithubEventHandler {
  private static _instance: GithubEventHandler;
  public static get instance(): GithubEventHandler {
    if (!this._instance) {
      this._instance = new GithubEventHandler();
    }

    return this._instance;
  }

  private constructor() {}

  // 
  // Start Comments
  // 

  public async onIssueCommentCreated(payload: IssueCommentCreatedPayload) {
    console.log(`Comment created: ${payload.comment.body}`);
    DiscordHandler.onIssueCommentCreated(payload);
  }

  public async onIssueCommentDeleted(payload: IssueCommentDeletedPayload) {
    console.log(`Comment deleted: ${payload.comment.body}`);
    DiscordHandler.onIssueCommentDeleted(payload);
  }

  public async onIssueCommentEdited(payload: IssueCommentEditedPayload) {
    console.log(`Comment edited: ${payload.comment.body}`);
    DiscordHandler.onIssueCommentEdited(payload);
  }

  // 
  // Start Labels
  // 

  public async onLabelCreated(payload: LabelCreatedPayload) {
    console.log(`Label created: ${payload.label.name}`);
    DiscordHandler.onLabelCreated(payload);
  }

  public async onLabelDeleted(payload: LabelDeletedPayload) {
    console.log(`Label deleted: ${payload.label.name}`);
    DiscordHandler.onLabelDeleted(payload);
  }

  public async onLabelEdited(payload: LabelEditedPayload) {
    console.log(`Label edited: ${payload.label.name}`);
    DiscordHandler.onLabelEdited(payload);
  }

  // 
  // Start Issues
  // 

  public async onIssueAssigned(payload: IssueAssignedPayload) {
    console.log(`Issue assigned: ${payload.issue.title}`);
    DiscordHandler.onIssueAssigned(payload);
  }

  public async onIssueClosed(payload: IssueClosedPayload) {
    console.log(`Issue closed: ${payload.issue.title}`);
    DiscordHandler.onIssueClosed(payload);
  }

  public async onIssueDeleted(payload: IssueDeletedPayload) {
    console.log(`Issue deleted: ${payload.issue.title}`);
    DiscordHandler.onIssueDeleted(payload);
  }

  public async onIssueDemilestoned(payload: IssueDemilestonedPayload) {
    console.log(`Issue demilestoned: ${payload.issue.title}`);
    DiscordHandler.onIssueDemilestoned(payload);
  }

  public async onIssueEdited(payload: IssueEditedPayload) {
    console.log(`Issue edited: ${payload.issue.title}`);
    DiscordHandler.onIssueEdited(payload);
  }

  public async onIssueLabeled(payload: IssueLabeledPayload) {
    console.log(`Issue labeled: ${payload.issue.title}`);
    DiscordHandler.onIssueLabeled(payload);
  }

  public async onIssueLocked(payload: IssueLockedPayload) {
    console.log(`Issue locked: ${payload.issue.title}`);
    DiscordHandler.onIssueLocked(payload);
  }

  public async onIssueMilestoned(payload: IssueMilestonedPayload) {
    console.log(`Issue milestoned: ${payload.issue.title}`);
    DiscordHandler.onIssueMilestoned(payload);
  }

  public async onIssueOpened(payload: IssueOpenedPayload) {
    console.log(`Issue opened: ${payload.issue.title}`);
    DiscordHandler.onIssueOpened(payload);
  }

  public async onIssuePinned(payload: IssuePinnedPayload) {
    console.log(`Issue pinned: ${payload.issue.title}`);
    DiscordHandler.onIssuePinned(payload);
  }

  public async onIssueReopened(payload: IssueReopenedPayload) {
    console.log(`Issue reopened: ${payload.issue.title}`);
    DiscordHandler.onIssueReopened(payload);
  }

  public async onIssueTransferred(payload: IssueTransferredPayload) {
    console.log(`Issue transferred: ${payload.issue.title}`);
    DiscordHandler.onIssueTransferred(payload);
  }

  public async onIssueUnassigned(payload: IssueUnassignedPayload) {
    console.log(`Issue unassigned: ${payload.issue.title}`);
    DiscordHandler.onIssueUnassigned(payload);
  }

  public async onIssueUnlabeled(payload: IssueUnlabeledPayload) {
    console.log(`Issue unlabeled: ${payload.issue.title}`);
    DiscordHandler.onIssueUnlabeled(payload);
  }

  public async onIssueUnlocked(payload: IssueUnlockedPayload) {
    console.log(`Issue unlocked: ${payload.issue.title}`);
    DiscordHandler.onIssueUnlocked(payload);
  }

  public async onIssueUnpinned(payload: IssueUnpinnedPayload) {
    console.log(`Issue unpinned: ${payload.issue.title}`);
    DiscordHandler.onIssueUnpinned(payload);
  }
}