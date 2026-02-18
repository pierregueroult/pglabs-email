import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { ClientService } from "../client/client.service";
import {
  MailboxChangesResponse,
  MailboxObject,
  MailboxSetResponse,
  MailboxRole,
} from "./mailbox.type";
import {
  MailboxCreateDto,
  MailboxDeleteDto,
  MailboxGetDto,
  MailboxQueryDto,
  MailboxUpdateDto,
} from "./mailbox.dto";

@Injectable()
export class MailboxService {
  private readonly logger = new Logger(MailboxService.name);

  constructor(private readonly client: ClientService) {}

  async list(
    userId: string,
    query: MailboxQueryDto = {},
    get: MailboxGetDto = {},
  ): Promise<{ ids: string[]; mailboxes: MailboxObject[]; total?: number }> {
    const response = await this.client.execute(userId, (builder) =>
      builder
        .call(
          "Mailbox/query",
          {
            filter: this.buildFilter(query),
            limit: query.limit,
            position: query.position,
            calculateTotal: query.calculateTotal,
            sortAsTree: query.sortAsTree ?? true,
          },
          "query",
        )
        .call(
          "Mailbox/get",
          {
            properties: get.properties ?? null,
          },
          "get",
        )
        .ref("get", "ids", "query", "Mailbox/query", "/ids"),
    );

    const queryResult = response.unwrap("query", "Mailbox/query");
    const getResult = response.unwrap("get", "Mailbox/get");

    return {
      ids: queryResult.ids,
      mailboxes: getResult.list,
      total: queryResult.total,
    };
  }

  async getAll(
    userId: string,
    get: MailboxGetDto = {},
  ): Promise<MailboxObject[]> {
    const response = await this.client.call(
      userId,
      "Mailbox/get",
      {
        ids: null,
        properties: get.properties ?? null,
      },
      "get",
    );

    const result = response.unwrap("get", "Mailbox/get");
    return result.list;
  }

  async getById(
    userId: string,
    mailboxId: string,
    get: MailboxGetDto = {},
  ): Promise<MailboxObject | null> {
    const response = await this.client.call(
      userId,
      "Mailbox/get",
      {
        ids: [mailboxId],
        properties: get.properties ?? null,
      },
      "get",
    );

    const result = response.unwrap("get", "Mailbox/get");

    if (result.notFound.includes(mailboxId)) {
      return null;
    }

    return result.list[0] ?? null;
  }

  async getByRole(
    userId: string,
    role: MailboxRole,
  ): Promise<MailboxObject | null> {
    const response = await this.client.execute(userId, (builder) =>
      builder
        .call("Mailbox/query", { filter: { role } }, "query")
        .call("Mailbox/get", {}, "get")
        .ref("get", "ids", "query", "Mailbox/query", "/ids"),
    );

    const queryResult = response.unwrap("query", "Mailbox/query");
    const getResult = response.unwrap("get", "Mailbox/get");

    if (queryResult.ids.length === 0) {
      this.logger.warn(
        `Aucune mailbox trouvée avec role="${role}" pour userId=${userId}`,
      );
      return null;
    }

    return getResult.list[0] ?? null;
  }

  async getChanges(
    userId: string,
    sinceState: string,
    maxChanges = 50,
  ): Promise<MailboxChangesResponse> {
    const response = await this.client.call(
      userId,
      "Mailbox/changes",
      { sinceState, maxChanges },
      "changes",
    );

    return response.unwrap("changes", "Mailbox/changes");
  }

  async create(
    userId: string,
    dto: MailboxCreateDto,
  ): Promise<{ mailbox: MailboxObject; id: string }> {
    const response = await this.client.call(
      userId,
      "Mailbox/set",
      {
        create: {
          newMailbox: {
            name: dto.name,
            parentId: dto.parentId ?? null,
            role: dto.role ?? null,
            sortOrder: dto.sortOrder ?? 0,
            isSubscribed: dto.isSubscribed ?? true,
          },
        },
      },
      "set",
    );

    const result = response.unwrap("set", "Mailbox/set");

    if (result.notCreated?.["newMailbox"]) {
      const error = result.notCreated["newMailbox"];
      throw new BadRequestException(
        `Impossible de créer la mailbox : ${error.type} - ${error.description}`,
      );
    }

    const mailbox = result.created?.["newMailbox"];
    if (!mailbox) {
      throw new BadRequestException("Mailbox créée mais absente de la réponse");
    }

    return { mailbox, id: mailbox.id };
  }

  async update(
    userId: string,
    dto: MailboxUpdateDto,
  ): Promise<MailboxSetResponse> {
    const { id, ...updates } = dto;

    const response = await this.client.call(
      userId,
      "Mailbox/set",
      {
        update: {
          [id]: updates,
        },
      },
      "set",
    );

    const result = response.unwrap("set", "Mailbox/set");

    if (result.notUpdated?.[id]) {
      const error = result.notUpdated[id];
      throw new BadRequestException(
        `Impossible de mettre à jour la mailbox ${id} : ${error.type} - ${error.description}`,
      );
    }

    return result;
  }

  async rename(
    userId: string,
    mailboxId: string,
    newName: string,
  ): Promise<MailboxSetResponse> {
    return this.update(userId, { id: mailboxId, name: newName });
  }

  async move(
    userId: string,
    mailboxId: string,
    newParentId: string | null,
  ): Promise<MailboxSetResponse> {
    return this.update(userId, { id: mailboxId, parentId: newParentId });
  }

  async destroy(
    userId: string,
    dto: MailboxDeleteDto,
  ): Promise<MailboxSetResponse> {
    const response = await this.client.call(
      userId,
      "Mailbox/set",
      {
        destroy: dto.ids,
        onDestroyRemoveEmails: dto.onDestroyRemoveEmails ?? false,
      },
      "set",
    );

    const result = response.unwrap("set", "Mailbox/set");

    if (result.notDestroyed) {
      for (const [id, error] of Object.entries(result.notDestroyed)) {
        this.logger.warn(
          `Impossible de supprimer mailbox ${id} : ${error.type} - ${error.description}`,
        );
      }
    }

    return result;
  }

  async getInboxId(userId: string): Promise<string> {
    const inbox = await this.getByRole(userId, "inbox");
    if (!inbox) {
      throw new NotFoundException(
        `Aucune mailbox Inbox trouvée pour userId=${userId}`,
      );
    }
    return inbox.id;
  }

  async getTrashId(userId: string): Promise<string> {
    const trash = await this.getByRole(userId, "trash");
    if (!trash) {
      throw new NotFoundException(
        `Aucune mailbox Trash trouvée pour userId=${userId}`,
      );
    }
    return trash.id;
  }

  async getSentId(userId: string): Promise<string> {
    const sent = await this.getByRole(userId, "sent");
    if (!sent) {
      throw new NotFoundException(
        `Aucune mailbox Sent trouvée pour userId=${userId}`,
      );
    }
    return sent.id;
  }

  async getDraftsId(userId: string): Promise<string> {
    const drafts = await this.getByRole(userId, "drafts");
    if (!drafts) {
      throw new NotFoundException(
        `Aucune mailbox Drafts trouvée pour userId=${userId}`,
      );
    }
    return drafts.id;
  }

  private buildFilter(query: MailboxQueryDto) {
    const filter: Record<string, unknown> = {};

    if (query.parentId !== undefined) filter["parentId"] = query.parentId;
    if (query.name) filter["name"] = query.name;
    if (query.role !== undefined) filter["role"] = query.role;

    return Object.keys(filter).length ? filter : undefined;
  }
}
