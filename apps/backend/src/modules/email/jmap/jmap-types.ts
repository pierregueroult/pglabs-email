export interface JmapSession {
    capabilities: Record<string, any>;
    accounts: Record<string, JmapAccount>;
    primaryAccounts: Record<string, string>;
    apiUrl: string;
    downloadUrl: string;
    uploadUrl: string;
    eventSourceUrl: string;
    state: string;
}

export interface JmapAccount {
    name: string;
    isPersonal: boolean;
    isReadOnly: boolean;
    accountCapabilities: Record<string, any>;
}

export interface JmapRequest {
    using: string[];
    methodCalls: [string, any, string][];
}

export interface JmapResponse {
    methodResponses: [string, any, string][];
    sessionState: string;
}

export interface JmapMailbox {
    id: string;
    name: string;
    parentId?: string;
    role?: string;
    sortOrder?: number;
    totalEmails?: number;
    unreadEmails?: number;
    totalThreads?: number;
    unreadThreads?: number;
    myRights?: Record<string, boolean>;
    isSubscribed?: boolean;
}

export interface JmapEmail {
    id: string;
    blobId: string;
    threadId: string;
    mailboxIds: Record<string, boolean>;
    keywords: Record<string, boolean>;
    size: number;
    receivedAt: string;
    messageId: string[];
    inReplyTo: string[];
    references: string[];
    sender: JmapEmailAddress[];
    from: JmapEmailAddress[];
    to: JmapEmailAddress[];
    cc: JmapEmailAddress[];
    bcc: JmapEmailAddress[];
    replyTo: JmapEmailAddress[];
    subject: string;
    sentAt: string;
    hasAttachment: boolean;
    preview: string;
    bodyValues?: Record<string, any>;
    textBody?: JmapEmailBodyPart[];
    htmlBody?: JmapEmailBodyPart[];
    attachments?: JmapEmailBodyPart[];
}

export interface JmapEmailAddress {
    name?: string;
    email: string;
}

export interface JmapEmailBodyPart {
    partId: string;
    blobId: string;
    size: number;
    name?: string;
    type: string;
    charset?: string;
    disposition?: string;
    cid?: string;
    language?: string[];
    location?: string;
    subParts?: JmapEmailBodyPart[];
}
