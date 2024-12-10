import { Router } from "express";
import { createSession } from "better-sse";
import { QueueEvents } from "bullmq";
import { getUnreadCountOfUser } from "../../controllers/chat/chatUnreadController";
import logger from "../../utils/logger";

const sendSSEAlarm = new QueueEvents("sendAlarm");

const SSEAlarmRouter = Router();

SSEAlarmRouter.get("/", async (req, res) => {
    const session = await createSession(req, res, {
        headers: { "access-control-allow-credentials": "true" },
    });

    if (res.session === undefined || res.session.user === undefined) {
        return;
    }
    const user = res.session.user;

    const ret = await getUnreadCountOfUser(user.id);

    session.push({ unreadTotalCount: ret });

    const callback = ({ jobId, returnvalue }) => {
        logger.debug(`sseEvent: ${session}`);
        session.push(returnvalue, "message");
    };
    logger.debug(`SSE connected: ${user.id.toString("hex")}`);
    sendSSEAlarm.on(`${user.id.toString("hex")}`, callback);

    session.on("disconnected", () => {
        logger.debug("SSE disconnected");
        sendSSEAlarm.off(`${user.id.toString("hex")}`, callback);
    });
});

export default SSEAlarmRouter;
