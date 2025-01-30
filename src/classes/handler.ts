import { IssuePayloadAction, PayloadAction } from '../types';

export abstract class AbstractHandler {
  public abstract handle<T extends PayloadAction>(
    type: T,
    payload: IssuePayloadAction<T>
  ): void;
}