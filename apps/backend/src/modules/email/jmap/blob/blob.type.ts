import { JmapSetError } from "../client/client.type";

export interface BlobCopyArgs {
  fromAccountId: string;
  accountId: string;
  blobIds: string[];
}

export interface BlobMethodArgs {
  "Blob/copy": BlobCopyArgs;
}

export interface BlobCopyResponse {
  fromAccountId: string;
  accountId: string;
  copied: Record<string, string> | null;
  notCopied: Record<string, JmapSetError> | null;
}

export interface BlobUploadResponse {
  accountId: string;
  blobId: string;
  type: string;
  size: number;
}
