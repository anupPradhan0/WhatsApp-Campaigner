import type { IUser } from "../models/user.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      /** Super admin id when this request runs inside a session switch. */
      impersonatorId?: string;
    }
  }
}

export {};
