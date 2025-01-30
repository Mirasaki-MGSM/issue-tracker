export type IssueAction = 'issue-assigned'
  | 'issue-closed'
  | 'issue-deleted'
  | 'issue-demilestoned'
  | 'issue-edited'
  | 'issue-labeled'
  | 'issue-locked'
  | 'issue-milestoned'
  | 'issue-opened'
  | 'issue-pinned'
  | 'issue-reopened'
  | 'issue-transferred'
  | 'issue-unassigned'
  | 'issue-unlabeled'
  | 'issue-unlocked'
  | 'issue-unpinned'

export type IssueCommentAction = 'issue-comment-created'
  | 'issue-comment-deleted'
  | 'issue-comment-edited';

export type LabelAction = 'label-created'
  | 'label-deleted'
  | 'label-edited';

export type PayloadAction = IssueAction | IssueCommentAction | LabelAction;

export type IssuePayloadAction<T extends PayloadAction> =
  T extends IssueCommentAction ? IssueCommentPayload
  : T extends LabelAction ? LabelPayload : IssuePayloadBase

export type Repository = {
  full_name: string;
  id: number;
  name: string;
  node_id: string;
  private: boolean;
}

export type User = {
  avatar_url: string | null;
  deleted: boolean;
  email: string | null;
  events_url: string | null;
  followers_url: string | null;
  following_url: string | null;
  gists_url: string | null;
  gravatar_id: string | null;
  html_url: string | null;
  id: number;
  login: string;
  name: string | null;
  node_id: string | null;
  organizations_url: string | null;
  received_events_url: string | null;
  repos_url: string | null;
  site_admin: boolean;
  starred_url: string | null;
  subscriptions_url: string | null;
  type: 'Bot' | 'User' | 'Organization' | null;
  url: string | null;
  user_view_type: string | null;
}

export type Label = {
  color: string;
  default: boolean;
  description: string | null;
  id: number;
  name: string;
  node_id: string;
  url: string;
}

export type Milestone = {
  closed_at: string | null;
  closed_issues: number;
  created_at: string;
  creator: User;
  description: string | null;
  due_on: string | null;
  html_url: string;
  id: number;
  labels_url: string;
  node_id: string;
  number: number;
  open_issues: number;
  state: 'open' | 'closed';
  title: string;
  updated_at: string;
  url: string;
}

export type GithubApp = {
  created_at: string;
  description: string;
  events: string[];
  external_url: string | null;
  html_url: string;
  id: number;
  name: string;
  node_id: string;
  owner: User | null;
  permissions: {
    [key: string]: 'read' | 'write';
  };
  slug: string | null;
  updated_at: string;
}

export type PullRequest = {
  diff_url: string;
  html_url: string;
  patch_url: string;
  url: string;
  merged_at: string | null;
}

export type Reactions = {
  '+1': number;
  '-1': number;
  confused: number;
  eyes: number;
  heart: number;
  hooray: number;
  laugh: number;
  rocket: number;
  total_count: number;
  url: string;
}

export type SubIssueSummary = {
  total: number;
  completed: number;
  percent_complete: number;
}

export type Issue = {
  active_lock_reason: string | null;
  assignee: User | null;
  assignees: User[];
  author_association: 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIMER' | 'FIRST_TIME_CONTRIBUTOR' | 'MANNEQUIN' | 'MEMBER' | 'NONE' | 'OWNER';
  body: string | null;
  closed_at: string | null;
  comments: number;
  comments_url: string;
  created_at: string;
  draft: boolean;
  events_url: string;
  html_url: string;
  id: number;
  labels: Label[];
  labels_url: string;
  locked: boolean;
  milestone: Milestone | null;
  node_id: string;
  number: number;
  performed_via_github_app: GithubApp | null;
  pull_request: PullRequest | null;
  reactions: Reactions;
  repository_url: string;
  sub_issue_summary: SubIssueSummary | null;
  state: 'open' | 'closed';
  state_reason: string | null;
  timeline_url: string;
  title: string;
  updated_at: string;
  url: string;
  user: User;
}

export type Comment = {
  author_association: 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIMER' | 'FIRST_TIME_CONTRIBUTOR' | 'MANNEQUIN' | 'MEMBER' | 'NONE' | 'OWNER';
  body: string;
  created_at: string;
  html_url: string;
  id: number;
  issue_url: string;
  node_id: string;
  performed_via_github_app: null;
  reactions: Reactions;
  updated_at: string;
  url: string;
  user: User;
}

export type IssuePayloadBase = {
  // action: 'assigned'
  //   | 'closed'
  //   | 'deleted'
  //   | 'demilestoned'
  //   | 'edited'
  //   | 'labeled'
  //   | 'locked'
  //   | 'milestoned'
  //   | 'opened'
  //   | 'pinned'
  //   | 'reopened'
  //   | 'transferred'
  //   | 'unassigned'
  //   | 'unlabeled'
  //   | 'unlocked'
  //   | 'unpinned';
  issue: Issue;
  repository: Repository;
  sender: User;
}

export type IssueAssignedPayload = IssuePayloadBase & {
  action: 'assigned';
  assignee: User;
}

export type IssueClosedPayload = IssuePayloadBase & {
  action: 'closed';
}

export type IssueDeletedPayload = IssuePayloadBase & {
  action: 'deleted';
}

export type IssueDemilestonedPayload = IssuePayloadBase & {
  action: 'demilestoned';
  milestone: Milestone;
}

export type IssueEditedPayload = IssuePayloadBase & {
  action: 'edited';
  changes: {
    body: {
      from: string;
    };
    title: {
      from: string;
    };
  }
}

export type IssueLabeledPayload = IssuePayloadBase & {
  action: 'labeled';
  label: Label;
}

export type IssueLockedPayload = IssuePayloadBase & {
  action: 'locked';
}

export type IssueMilestonedPayload = IssuePayloadBase & {
  action: 'milestoned';
  milestone: Milestone;
}

export type IssueOpenedPayload = IssuePayloadBase & {
  action: 'opened';
}

export type IssuePinnedPayload = IssuePayloadBase & {
  action: 'pinned';
}

export type IssueReopenedPayload = IssuePayloadBase & {
  action: 'reopened';
}

export type IssueTransferredPayload = IssuePayloadBase & {
  action: 'transferred';
  changes: {
    new_issue: Issue;
    new_repository: Repository;
  }
}

export type IssueUnassignedPayload = IssuePayloadBase & {
  action: 'unassigned';
  assignee: User;
}

export type IssueUnlabeledPayload = IssuePayloadBase & {
  action: 'unlabeled';
  label: Label;
}

export type IssueUnlockedPayload = IssuePayloadBase & {
  action: 'unlocked';
}

export type IssueUnpinnedPayload = IssuePayloadBase & {
  action: 'unpinned';
}

export type IssueCommentPayload = {
  comment: Comment;
  issue: Issue;
  repository: Repository;
  sender: User;
}

export type IssueCommentCreatedPayload = IssueCommentPayload & {
  action: 'created';
}

export type IssueCommentDeletedPayload = IssueCommentPayload & {
  action: 'deleted';
}

export type IssueCommentEditedPayload = IssueCommentPayload & {
  action: 'edited';
  changes: {
    body: {
      from: string;
    }
  }
}

export type LabelPayload = {
  label: Label;
  repository: Repository;
  sender: User;
}

export type LabelCreatedPayload = LabelPayload & {
  action: 'created';
}

export type LabelDeletedPayload = LabelPayload & {
  action: 'deleted';
}

export type LabelEditedPayload = LabelPayload & {
  action: 'edited';
  changes: {
    color: {
      from: string;
    };
    description: {
      from: string;
    };
    name: {
      from: string;
    };
  }
}

// [DEV] Implement sub issues

export type SubIssue = {
  id: number;
  node_id: string;
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  number: number;
  state: 'open' | 'closed';
  state_reason: 'completed' | 'reopened' | 'not_planned' | null
  title: string;
  body: string | null;
  user: User;
  labels: Label[];
  assignee: User | null;
  assignees: User[];
  milestone: Milestone | null;
  locked: boolean;
  active_lock_reason: string | null;
  comments: number;
  pull_request: PullRequest | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  draft: boolean;
  closed_by: User | null;
  body_html: string | null;
  body_text: string | null;
  timeline_url: string;
  repository: Repository;
  performed_via_github_app: null;
  author_association: 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIMER' | 'FIRST_TIME_CONTRIBUTOR' | 'MANNEQUIN' | 'MEMBER' | 'NONE' | 'OWNER';
  reactions: Reactions;
  sub_issues_summary: SubIssueSummary | null;
}

export type SubIssuePayload = {
  action: 'parent_issue_added';
  parent_issue_id: number;
  parent_issue: Issue;
  parent_issue_repo: Repository;
  sub_issue_id: number;
  sub_issue: SubIssue;
  repository: Repository;
  sender: User;
}
