import { Injectable, Logger } from "@nestjs/common";

import { ClientService } from "../client/client.service";
import { ThreadChangesResponse, ThreadObject } from "./thread.type";
import { ThreadGetDto } from "./thread.dto";

@Injectable()
export class ThreadService {
  private readonly logger = new Logger(ThreadService.name);

  constructor(private readonly client: ClientService) {}

  async getById(
    userId: string,
    threadId: string,
    dto: ThreadGetDto = {},
  ): Promise<ThreadObject | null> {
    const response = await this.client.call(
      userId,
      "Thread/get",
      {
        ids: [threadId],
        properties: dto.properties ?? null,
      },
      "get",
    );

    const result = response.unwrap("get", "Thread/get");

    if (result.notFound.includes(threadId)) {
      return null;
    }

    return result.list[0] ?? null;
  }

  async getByIds(
    userId: string,
    threadIds: string[],
    dto: ThreadGetDto = {},
  ): Promise<ThreadObject[]> {
    if (threadIds.length === 0) {
      return [];
    }

    const response = await this.client.call(
      userId,
      "Thread/get",
      {
        ids: threadIds,
        properties: dto.properties ?? null,
      },
      "get",
    );

    const result = response.unwrap("get", "Thread/get");
    return result.list;
  }

  async getFromEmails(
    userId: string,
    emailIds: string[],
    dto: ThreadGetDto = {},
  ): Promise<Map<string, ThreadObject>> {
    const emailResponse = await this.client.call(
      userId,
      "Email/get",
      {
        ids: emailIds,
        properties: ["id", "threadId"],
      },
      "getEmails",
    );

    const emails = emailResponse.unwrap("getEmails", "Email/get");

    const threadIds = [...new Set(emails.list.map((e) => e.threadId))];

    if (threadIds.length === 0) {
      return new Map();
    }

    const threads = await this.getByIds(userId, threadIds, dto);

    return new Map(threads.map((t) => [t.id, t]));
  }

  async getChanges(
    userId: string,
    sinceState: string,
    maxChanges = 50,
  ): Promise<ThreadChangesResponse> {
    const response = await this.client.call(
      userId,
      "Thread/changes",
      { sinceState, maxChanges },
      "changes",
    );

    return response.unwrap("changes", "Thread/changes");
  }
}
