import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { type AxiosError, isAxiosError } from "axios";

import { SessionService } from "../session/session.service";
import { JmapResponseParser } from "./client.parser";
import { JmapRequestBuilder } from "./client.builder";
import {
  JmapParsedResponse,
  JmapMethod,
  JmapMethodArgs,
  JmapRequest,
  JmapResponse,
} from "./client.type";
import { ConfigService } from "@nestjs/config";

type BuilderCallback = (builder: JmapRequestBuilder) => JmapRequestBuilder;

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  private readonly apiUrl: string;

  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly parser: JmapResponseParser,
    private readonly http: HttpService,
  ) {
    this.apiUrl =
      this.configService.getOrThrow<string>("mail.stalwart.url") + "jmap";
  }

  async execute(
    userId: string,
    buildBatch: BuilderCallback,
  ): Promise<JmapParsedResponse> {
    const session = this.sessionService.getSession(userId);
    const builder = new JmapRequestBuilder();
    const request = buildBatch(builder).build();

    return await this.send(session.token, request);
  }

  async call<M extends keyof JmapMethodArgs>(
    userId: string,
    method: M,
    args: Omit<JmapMethodArgs[M], "accountId"> & { accountId?: string },
    callId = "r1",
  ): Promise<JmapParsedResponse> {
    return this.execute(userId, (builder) =>
      builder.call(method, args, callId),
    );
  }

  async queryThenGet<
    QM extends keyof JmapMethodArgs & `${string}/query`,
    GM extends keyof JmapMethodArgs & `${string}/get`,
  >(
    userId: string,
    queryMethod: QM,
    getMethod: GM,
    queryArgs: Omit<JmapMethodArgs[QM], "accountId">,
    getArgs: Omit<JmapMethodArgs[GM], "accountId">,
  ): Promise<JmapParsedResponse> {
    return this.execute(userId, (builder) =>
      builder
        .call(queryMethod, queryArgs, "query")
        .call(getMethod, getArgs, "get")
        .ref("get", "ids", "query", queryMethod as JmapMethod, "/ids"),
    );
  }

  private async send(
    token: string,
    request: JmapRequest,
  ): Promise<JmapParsedResponse> {
    this.logger.debug(
      `POST ${this.apiUrl} — ${request.methodCalls.length} invocation(s) : ` +
        request.methodCalls.map(([m, , id]) => `${id}:${m}`).join(", "),
    );

    let response: JmapResponse;

    try {
      const result = await firstValueFrom(
        this.http.post<JmapResponse>(this.apiUrl, request, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Accept: "application/json",
            Authorization: `Basic ${token}`,
          },
        }),
      );

      response = result.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw this.toNestException(error);
      }
      throw new InternalServerErrorException(
        `Erreur inattendue : ${error instanceof Error ? error : String(error)}`,
      );
    }

    return this.parser.parse(response);
  }

  private toNestException(error: AxiosError): Error {
    const status: number | undefined = error.response?.status ?? error.status;

    const messages: Partial<Record<number, string>> = {
      401: `Authentification JMAP refusée`,
      403: `Accès JMAP interdit`,
      404: `Endpoint JMAP introuvable`,
      429: `Rate limit JMAP dépassé`,
      503: `Serveur JMAP indisponible`,
    };

    if (status && messages[status]) {
      if (status === 401) {
        return new UnauthorizedException(messages[401]);
      }
      return new InternalServerErrorException(messages[status]);
    }

    if (!error.response) {
      return new InternalServerErrorException(
        `Impossible de joindre le serveur JMAP : ${error.message}`,
      );
    }

    return new InternalServerErrorException(
      `Erreur JMAP inattendue (HTTP ${status}) : ${error.message}`,
    );
  }
}
