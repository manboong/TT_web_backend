import * as express from "express";
declare global {
    namespace Express {
        export interface Response {
            session: {
                user: {
                    id: string | Buffer;
                    name: string;
                    email: string;
                    roles: string[];
                };
            };
        }
    }
}
