import { JmapResultReference } from "../client/client.type";

export type ThreadProperty = "id" | "emailIds";

export interface ThreadGetArgs {
  accountId?: string;
  ids?: string[];
  "#ids"?: JmapResultReference;
  properties?: ThreadProperty[] | null;
}

export interface ThreadChangesArgs {
  accountId?: string;
  sinceState: string;
  maxChanges?: number;
}

export interface ThreadMethodArgs {
  "Thread/get": ThreadGetArgs;
  "Thread/changes": ThreadChangesArgs;
}

export interface ThreadObject {
  id: string;
  emailIds: string[];
}

export interface ThreadGetResponse {
  accountId: string;
  state: string;
  list: ThreadObject[];
  notFound: string[];
}

export interface ThreadChangesResponse {
  accountId: string;
  oldState: string;
  newState: string;
  hasMoreChanges: boolean;
  created: string[];
  updated: string[];
  destroyed: string[];
}
