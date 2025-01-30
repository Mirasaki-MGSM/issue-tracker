import { IssueActionPayload, IssueActions } from '../types';

export abstract class AbstractHandler {
  public abstract handle<T extends IssueActions>(
    type: T,
    payload: IssueActionPayload<T>
  ): void;
}