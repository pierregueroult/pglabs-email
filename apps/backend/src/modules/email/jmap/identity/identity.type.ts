import { JmapResultReference, JmapSetError } from "../client/client.type";

export type IdentityProperty =
  | "id"
  | "name"
  | "email"
  | "replyTo"
  | "bcc"
  | "textSignature"
  | "htmlSignature"
  | "mayDelete";

export interface IdentityGetArgs {
  accountId?: string;
  ids?: string[] | null;
  "#ids"?: JmapResultReference;
  properties?: IdentityProperty[] | null;
}

export interface IdentityChangesArgs {
  accountId?: string;
  sinceState: string;
  maxChanges?: number;
}

export interface IdentitySetObject {
  name?: string;
  email?: string;
  replyTo?: Array<{ name?: string; email: string }> | null;
  bcc?: Array<{ name?: string; email: string }> | null;
  textSignature?: string;
  htmlSignature?: string;
}

export interface IdentitySetArgs {
  accountId?: string;
  ifInState?: string;
  create?: Record<string, IdentitySetObject>;
  update?: Record<string, Partial<IdentitySetObject>>;
  destroy?: string[];
  "#destroy"?: JmapResultReference;
}

export interface IdentityMethodArgs {
  "Identity/get": IdentityGetArgs;
  "Identity/changes": IdentityChangesArgs;
  "Identity/set": IdentitySetArgs;
}

export interface IdentityObject {
  id: string;
  name: string;
  email: string;
  replyTo: Array<{ name?: string; email: string }> | null;
  bcc: Array<{ name?: string; email: string }> | null;
  textSignature: string;
  htmlSignature: string;
  mayDelete: boolean;
}

export interface IdentityGetResponse {
  accountId: string;
  state: string;
  list: IdentityObject[];
  notFound: string[];
}

export interface IdentitySetResponse {
  accountId: string;
  oldState: string;
  newState: string;
  created: Record<string, IdentityObject> | null;
  updated: Record<string, IdentityObject | null> | null;
  destroyed: string[] | null;
  notCreated: Record<string, JmapSetError> | null;
  notUpdated: Record<string, JmapSetError> | null;
  notDestroyed: Record<string, JmapSetError> | null;
}

export interface IdentityChangesResponse {
  accountId: string;
  oldState: string;
  newState: string;
  hasMoreChanges: boolean;
  created: string[];
  updated: string[];
  destroyed: string[];
}
