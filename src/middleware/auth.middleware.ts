import { getSession } from "@auth/express";
import { authConfig } from "../config/auth.config.js";
import type { NextFunction, Request, Response } from "express";
import logger from "../utils/logger.js";

export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const session =
        res.locals.session ?? (await getSession(req, authConfig)) ?? undefined;
    res.locals.session = session;

    if (session) {
        return next();
    }

    res.status(401).json({ message: "Not Authenticated" });
};

export const currentSession = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const session = (await getSession(req, authConfig)) ?? undefined;
    res.session = session;

    // encode JSON.stringfied Buffer to Buffer
    // https://stackoverflow.com/questions/34557889/how-to-deserialize-a-nested-buffer-using-json-parse
    if (
        session !== undefined &&
        session.user !== undefined &&
        session.user.id !== undefined
    ) {
        res.session.user.id = Buffer.from(session.user?.id.data);
    }

    return next();
};
