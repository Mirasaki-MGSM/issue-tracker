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
  }

  public async onLabelDeleted(payload: LabelDeletedPayload) {
    console.log(`Label deleted: ${payload.label.name}`);
  }

  public async onLabelEdited(payload: LabelEditedPayload) {
    console.log(`Label edited: ${payload.label.name}`);
  }

  // 
  // Start Issues
  // 

  public async onIssueAssigned(payload: IssueAssignedPayload) {
    console.log(`Issue assigned: ${payload.issue.title}`);
  }

  public async onIssueClosed(payload: IssueClosedPayload) {
    console.log(`Issue closed: ${payload.issue.title}`);
  }

  public async onIssueDeleted(payload: IssueDeletedPayload) {
    console.log(`Issue deleted: ${payload.issue.title}`);
  }

  public async onIssueDemilestoned(payload: IssueDemilestonedPayload) {
    console.log(`Issue demilestoned: ${payload.issue.title}`);
  }

  public async onIssueEdited(payload: IssueEditedPayload) {
    console.log(`Issue edited: ${payload.issue.title}`);
  }

  public async onIssueLabeled(payload: IssueLabeledPayload) {
    console.log(`Issue labeled: ${payload.issue.title}`);
  }

  public async onIssueLocked(payload: IssueLockedPayload) {
    console.log(`Issue locked: ${payload.issue.title}`);
  }

  public async onIssueMilestoned(payload: IssueMilestonedPayload) {
    console.log(`Issue milestoned: ${payload.issue.title}`);
  }

  public async onIssueOpened(payload: IssueOpenedPayload) {
    console.log(`Issue opened: ${payload.issue.title}`);
  }

  public async onIssuePinned(payload: IssuePinnedPayload) {
    console.log(`Issue pinned: ${payload.issue.title}`);
  }

  public async onIssueReopened(payload: IssueReopenedPayload) {
    console.log(`Issue reopened: ${payload.issue.title}`);
  }

  public async onIssueTransferred(payload: IssueTransferredPayload) {
    console.log(`Issue transferred: ${payload.issue.title}`);
  }

  public async onIssueUnassigned(payload: IssueUnassignedPayload) {
    console.log(`Issue unassigned: ${payload.issue.title}`);
  }

  public async onIssueUnlabeled(payload: IssueUnlabeledPayload) {
    console.log(`Issue unlabeled: ${payload.issue.title}`);
  }

  public async onIssueUnlocked(payload: IssueUnlockedPayload) {
    console.log(`Issue unlocked: ${payload.issue.title}`);
  }

  public async onIssueUnpinned(payload: IssueUnpinnedPayload) {
    console.log(`Issue unpinned: ${payload.issue.title}`);
  }
}