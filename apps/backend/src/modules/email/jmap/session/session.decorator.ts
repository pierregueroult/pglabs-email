import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const GetJmapSession = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest<Request>().user;
    if (!user) throw new Error("No user found in request");
    const jmap = context.switchToHttp().getRequest<Request>().jmap;
    if (!jmap) throw new Error("No jmap session found in request");
    return jmap;
  },
);
