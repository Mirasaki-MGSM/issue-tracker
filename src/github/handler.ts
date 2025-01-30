import { AbstractHandler } from '../classes/handler';
import { IssuePayloadAction, PayloadAction } from '../types';

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

  public handle<T extends PayloadAction>(
    type: T,
    payload: IssuePayloadAction<T>
  ): void {
    console.log('Handling GitHub event:', type, payload);
  }
}