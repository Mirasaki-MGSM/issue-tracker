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
  deleted?: boolean;
  email?: string | null | undefined;
  events_url: string | null;
  followers_url: string | null;
  following_url: string | null;
  gists_url: string | null;
  gravatar_id: string | null;
  html_url: string | null;
  id: number;
  login: string;
  name?: string | null | undefined;
  node_id: string | null;
  organizations_url: string | null;
  received_events_url: string | null;
  repos_url: string | null;
  site_admin: boolean;
  starred_url: string | null;
  subscriptions_url: string | null;
  type: string; // 'Bot' | 'User' | 'Organization' | null;
  url: string | null;
  user_view_type?: string | null | undefined;
}

export type Label = {
  color?: string | null | undefined;
  default?: boolean | undefined;
  description?: string | null | undefined;
  id?: number | undefined;
  name?: string | undefined;
  node_id?: string | undefined;
  url?: string | undefined;
}

export type Milestone = {
  closed_at: string | null;
  closed_issues: number;
  created_at: string;
  creator: User | null;
  description?: string | null | undefined;
  due_on: string | null;
  html_url: string;
  id: number;
  labels_url: string;
  node_id: string;
  number: number;
  open_issues: number;
  state: string; // 'open' | 'closed';
  title: string;
  updated_at: string;
  url: string;
}

export type GithubApp = {
  created_at: string;
  description: string | null;
  events: string[];
  external_url: string | null;
  html_url: string;
  id: number;
  name: string | null;
  node_id: string;
  owner: User | null;
  permissions: {
    [key: string]: 'read' | 'write' | string | undefined;
  };
  slug?: string | null | undefined;
  updated_at: string;
}

export type PullRequest = {
  diff_url: string | null;
  html_url: string | null;
  patch_url: string | null;
  url: string | null;
  merged_at?: string | null | undefined;
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

export type Issue = {
  active_lock_reason?: string | null | undefined;
  assignee: User | null;
  assignees?: User[] | null | undefined;
  author_association: 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIMER' | 'FIRST_TIME_CONTRIBUTOR' | 'MANNEQUIN' | 'MEMBER' | 'NONE' | 'OWNER';
  body?: string | null | undefined;
  closed_at: string | null;
  comments: number;
  comments_url: string;
  created_at: string;
  draft?: boolean | undefined;
  events_url: string;
  html_url: string;
  id: number;
  labels: (string | Label)[];
  labels_url: string;
  locked: boolean;
  milestone: Milestone | null;
  node_id: string;
  number: number;
  performed_via_github_app?: GithubApp | null | undefined;
  pull_request?: PullRequest | null | undefined;
  reactions?: Reactions | undefined;
  repository_url: string;
  state: string; // 'open' | 'closed';
  state_reason?: string | null | undefined; // 'completed' | 'reopened' | 'not_planned' | null
  timeline_url?: string | null | undefined;
  title: string;
  updated_at: string;
  url: string;
  user: User | null;
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
  reactions?: Reactions | undefined;
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
    body?: {
      from: string;
    };
    title?: {
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
    body?: {
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
    color?: {
      from: string;
    };
    description?: {
      from: string;
    };
    name?: {
      from: string;
    };
  }
}
