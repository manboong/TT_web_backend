import express, { Request, Response } from "express";
import { APISpec } from "api_spec";
import {
    createRequest,
    getRequestByRequestId,
} from "../controllers/wiip/RequestController";

const RequestRouter = express.Router();

RequestRouter.post("/" satisfies keyof APISpec.RequestAPISpec, (async (
    req,
    res,
) => {
    const user = res.session?.user ?? undefined;

    const { data, role } = req.body;

    if (user === undefined) {
        res.json("Login first");
        return;
    }
    if (!user.roles.includes(role)) {
        res.json("Incorrect role");
        return;
    }

    const request_id = await createRequest(user.id, role, data);

    if (request_id === undefined) {
        res.status(500).json({ message: "Internal Server Error" });
    } else {
        res.status(201).json({
            message: "Request Body created successfully",
            request_id: request_id,
        });
    }
}) as APISpec.RequestAPISpec["/"]["post"]["__handler"]);

RequestRouter.get("/:request_id", async (req: Request, res: Response) => {
    const request_id = req.params.request_id;
    const user = res.session?.user ?? null;
    const roles: string[] = user?.roles ?? null;
    // TODO: response edit button for corporation

    const requestBody = await getRequestByRequestId(Number(request_id));

    const ret = requestBody?.get({ plain: true });

    res.json(ret);
});

export default RequestRouter;
