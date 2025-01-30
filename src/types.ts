export type IssueActions = 
  | 'closed'
  | 'commented'
  | 'created'
  | 'deleted'
  | 'locked'
  | 'reopened'
  | 'unlocked'

export type IssueActionPayload<T extends IssueActions> =
  T extends 'commented' ? IssueCommentPayload : IssuePayload