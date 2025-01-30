import { AbstractHandler } from '../classes/handler';
import { IssueAction, IssueCommentAction, IssueCommentPayload, IssuePayload, IssuePayloadAction, LabelAction, LabelPayload, PayloadAction } from '../types';

export class GithubEventHandler extends AbstractHandler {
  private static _instance: GithubEventHandler;
  public static get instance(): GithubEventHandler {
    if (!this._instance) {
      this._instance = new GithubEventHandler();
    }

    return this._instance;
  }

  private constructor() {
    super();
  }

  public handle(type: IssueCommentAction, payload: IssueCommentPayload): void;
  public handle(type: LabelAction, payload: LabelPayload): void;
  public handle(type: IssueAction, payload: IssuePayload): void;
  public handle<T extends PayloadAction>(type: T, payload: IssuePayloadAction<T>): void {
    switch (type) {
      // Comments
      case 'issue-comment-created':
        this.onIssueCommentCreated(payload as IssueCommentPayload);
        break;
      case 'issue-comment-deleted':
        this.onIssueCommentDeleted(payload as IssueCommentPayload);
        break;
      case 'issue-comment-edited':
        this.onIssueCommentEdited(payload as IssueCommentPayload);
        break;

      // Labels
      case 'label-created':
        this.onLabelCreated(payload as LabelPayload);
        break;
      case 'label-deleted':
        this.onLabelDeleted(payload as LabelPayload);
        break;
      case 'label-edited':
        this.onLabelEdited(payload as LabelPayload);
        break;

      // Issues
      case 'issue-assigned':
        this.onIssueAssigned(payload as IssuePayload);
        break;
      case 'issue-closed':
        this.onIssueClosed(payload as IssuePayload);
        break;
      case 'issue-deleted':
        this.onIssueDeleted(payload as IssuePayload);
        break;
      case 'issue-demilestoned':
        this.onIssueDemilestoned(payload as IssuePayload);
        break;
      case 'issue-edited':
        this.onIssueEdited(payload as IssuePayload);
        break;
      case 'issue-labeled':
        this.onIssueLabeled(payload as IssuePayload);
        break;
      case 'issue-locked':
        this.onIssueLocked(payload as IssuePayload);
        break;
      case 'issue-milestoned':
        this.onIssueMilestoned(payload as IssuePayload);
        break;
      case 'issue-opened':
        this.onIssueOpened(payload as IssuePayload);
        break;
      case 'issue-pinned':
        this.onIssuePinned(payload as IssuePayload);
        break;
      case 'issue-reopened':
        this.onIssueReopened(payload as IssuePayload);
        break;
      case 'issue-transferred':
        this.onIssueTransferred(payload as IssuePayload);
        break;
      case 'issue-unassigned':
        this.onIssueUnassigned(payload as IssuePayload);
        break;
      case 'issue-unlabeled':
        this.onIssueUnlabeled(payload as IssuePayload);
        break;
      case 'issue-unlocked':
        this.onIssueUnlocked(payload as IssuePayload);
        break;
      case 'issue-unpinned':
        this.onIssueUnpinned(payload as IssuePayload);
        break;
      
      // Fallthrough
      default:
        console.warn(`Unhandled payload type: ${type}`);
        break;
    }
  }

  // 
  // Start Comments
  // 

  private onIssueCommentCreated(payload: IssueCommentPayload) {
    console.log(`Comment created: ${payload.comment.body}`);
  }

  private onIssueCommentDeleted(payload: IssueCommentPayload) {
    console.log(`Comment deleted: ${payload.comment.body}`);
  }

  private onIssueCommentEdited(payload: IssueCommentPayload) {
    console.log(`Comment edited: ${payload.comment.body}`);
  }

  // 
  // Start Labels
  // 

  private onLabelCreated(payload: LabelPayload) {
    console.log(`Label created: ${payload.label.name}`);
  }

  private onLabelDeleted(payload: LabelPayload) {
    console.log(`Label deleted: ${payload.label.name}`);
  }

  private onLabelEdited(payload: LabelPayload) {
    console.log(`Label edited: ${payload.label.name}`);
  }

  // 
  // Start Issues
  // 

  private onIssueAssigned(payload: IssuePayload) {
    console.log(`Issue assigned: ${payload.issue.title}`);
  }

  private onIssueClosed(payload: IssuePayload) {
    console.log(`Issue closed: ${payload.issue.title}`);
  }

  private onIssueDeleted(payload: IssuePayload) {
    console.log(`Issue deleted: ${payload.issue.title}`);
  }

  private onIssueDemilestoned(payload: IssuePayload) {
    console.log(`Issue demilestoned: ${payload.issue.title}`);
  }

  private onIssueEdited(payload: IssuePayload) {
    console.log(`Issue edited: ${payload.issue.title}`);
  }

  private onIssueLabeled(payload: IssuePayload) {
    console.log(`Issue labeled: ${payload.issue.title}`);
  }

  private onIssueLocked(payload: IssuePayload) {
    console.log(`Issue locked: ${payload.issue.title}`);
  }

  private onIssueMilestoned(payload: IssuePayload) {
    console.log(`Issue milestoned: ${payload.issue.title}`);
  }

  private onIssueOpened(payload: IssuePayload) {
    console.log(`Issue opened: ${payload.issue.title}`);
  }

  private onIssuePinned(payload: IssuePayload) {
    console.log(`Issue pinned: ${payload.issue.title}`);
  }

  private onIssueReopened(payload: IssuePayload) {
    console.log(`Issue reopened: ${payload.issue.title}`);
  }

  private onIssueTransferred(payload: IssuePayload) {
    console.log(`Issue transferred: ${payload.issue.title}`);
  }

  private onIssueUnassigned(payload: IssuePayload) {
    console.log(`Issue unassigned: ${payload.issue.title}`);
  }

  private onIssueUnlabeled(payload: IssuePayload) {
    console.log(`Issue unlabeled: ${payload.issue.title}`);
  }

  private onIssueUnlocked(payload: IssuePayload) {
    console.log(`Issue unlocked: ${payload.issue.title}`);
  }

  private onIssueUnpinned(payload: IssuePayload) {
    console.log(`Issue unpinned: ${payload.issue.title}`);
  }
}