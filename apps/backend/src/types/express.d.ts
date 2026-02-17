import { UserSession } from "src/modules/auth/auth.type";
import { JmapSession } from "src/modules/email/jmap/session/session.type";

declare module "express" {
  interface Request {
    user?: UserSession;
    jmap?: JmapSession;
  }
}
