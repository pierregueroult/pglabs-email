import { JmapResultReference, JmapSetError } from "../client/client.type";

export type MailboxProperty =
  | "id"
  | "name"
  | "parentId"
  | "role"
  | "sortOrder"
  | "totalEmails"
  | "unreadEmails"
  | "totalThreads"
  | "unreadThreads"
  | "myRights"
  | "isSubscribed";

export type MailboxRole =
  | "inbox"
  | "archive"
  | "drafts"
  | "sent"
  | "trash"
  | "junk"
  | "important"
  | "all"
  | "flagged"
  | (string & {});

export interface MailboxRights {
  mayReadItems: boolean;
  mayAddItems: boolean;
  mayRemoveItems: boolean;
  maySetSeen: boolean;
  maySetKeywords: boolean;
  mayCreateChild: boolean;
  mayRename: boolean;
  mayDelete: boolean;
  maySubmit: boolean;
}

export interface MailboxFilterCondition {
  parentId?: string | null;
  name?: string;
  role?: MailboxRole | null;
  hasAnyRole?: boolean;
  isSubscribed?: boolean;
}

export interface MailboxFilterOperator {
  operator: "AND" | "OR" | "NOT";
  conditions: MailboxFilter[];
}

export type MailboxFilter = MailboxFilterCondition | MailboxFilterOperator;

export type MailboxSortProperty = "name" | "sortOrder" | "parentId";

export interface MailboxSortComparator {
  property: MailboxSortProperty;
  isAscending?: boolean;
  collation?: string;
}

export interface MailboxGetArgs {
  accountId?: string;
  ids?: string[] | null;
  "#ids"?: JmapResultReference;
  properties?: MailboxProperty[] | null;
}

export interface MailboxQueryArgs {
  accountId?: string;
  filter?: MailboxFilter;
  sort?: MailboxSortComparator[];
  position?: number;
  limit?: number;
  calculateTotal?: boolean;
  sortAsTree?: boolean;
  filterAsTree?: boolean;
}

export interface MailboxQueryChangesArgs {
  accountId?: string;
  filter?: MailboxFilter;
  sort?: MailboxSortComparator[];
  sinceQueryState: string;
  maxChanges?: number;
  upToId?: string;
  calculateTotal?: boolean;
}

export interface MailboxChangesArgs {
  accountId?: string;
  sinceState: string;
  maxChanges?: number;
}

export interface MailboxSetObject {
  name?: string;
  parentId?: string | null;
  role?: MailboxRole | null;
  sortOrder?: number;
  isSubscribed?: boolean;
}

export interface MailboxSetArgs {
  accountId?: string;
  ifInState?: string;
  create?: Record<string, MailboxSetObject>;
  update?: Record<string, Partial<MailboxSetObject>>;
  destroy?: string[];
  "#destroy"?: JmapResultReference;
  onDestroyRemoveEmails?: boolean;
}

export interface MailboxMethodArgs {
  "Mailbox/get": MailboxGetArgs;
  "Mailbox/query": MailboxQueryArgs;
  "Mailbox/queryChanges": MailboxQueryChangesArgs;
  "Mailbox/changes": MailboxChangesArgs;
  "Mailbox/set": MailboxSetArgs;
}

export interface MailboxObject {
  id: string;
  name: string;
  parentId: string | null;
  role: MailboxRole | null;
  sortOrder: number;
  totalEmails: number;
  unreadEmails: number;
  totalThreads: number;
  unreadThreads: number;
  myRights: MailboxRights;
  isSubscribed: boolean;
}

export interface MailboxGetResponse {
  accountId: string;
  state: string;
  list: MailboxObject[];
  notFound: string[];
}

export interface MailboxQueryResponse {
  accountId: string;
  queryState: string;
  canCalculateChanges: boolean;
  position: number;
  ids: string[];
  total?: number;
}

export interface MailboxSetResponse {
  accountId: string;
  oldState: string;
  newState: string;
  created: Record<string, MailboxObject> | null;
  updated: Record<string, MailboxObject | null> | null;
  destroyed: string[] | null;
  notCreated: Record<string, JmapSetError> | null;
  notUpdated: Record<string, JmapSetError> | null;
  notDestroyed: Record<string, JmapSetError> | null;
}

export interface MailboxChangesResponse {
  accountId: string;
  oldState: string;
  newState: string;
  hasMoreChanges: boolean;
  created: string[];
  updated: string[];
  destroyed: string[];
}

export interface MailboxQueryChangesResponse {
  accountId: string;
  oldQueryState: string;
  newQueryState: string;
  total?: number;
  removed: string[];
  added: Array<{ id: string; index: number }>;
}
