import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { sequelize } from "./models/rdbms";
import { createServer } from "http";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "./config/auth.config";
import { currentSession } from "./middleware/auth.middleware";
import RequestRouter from "./routes/RequestRouter";
import StudentRouter from "./routes/StudentRouter";
import SchoolRouter from "./routes/SchoolRouter";
import ConsumerRouter from "./routes/ConsumerRouter";
import StudentReviewRouter from "./routes/StudentReviewRouter";
import AcademicHistoryRouter from "./routes/AcademicHistoryRouter";
import ExamHistoryRouter from "./routes/LanguageHistory";
import CorporationRouter from "./routes/CorporationRouter";
import CorporationReviewRouter from "./routes/CorporationReviewRouter";
import RecommendRouter from "./routes/recommend/Recommend";
import VerificationRouter from "./routes/VerificationRouter";
import ChatRouter from "./routes/chat/chatRouter";
import SSEAlarmRouter from "./routes/chat/sseRouter";
import initChat from "./routes/chat/webSocketRouter";
import { chatTest } from "./dummyChatData";
import { TspecDocsMiddleware } from "tspec";
import * as rTracer from "cls-rtracer";

import logger from "./utils/logger";

const ErrorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    logger.error(err.stack);
    res.json();
};

const initServer = async () => {
    Error.stackTraceLimit = 999;
    const app = express();
    const PORT = process.env.PORT || 8080;
    process.env.NODE_ENV = "production";
    app.set("port", PORT);
    app.use(cors({ origin: true, credentials: true }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(currentSession);
    app.use(
        rTracer.expressMiddleware({
            requestIdFactory: (req) => ({
                id: crypto.randomUUID(),
                glbTraceId: req.headers["X-Global-Trace-Id"] ?? "",
                userId: req.session?.user?.id.toString("hex") ?? "",
            }),
        }),
    );
    sequelize
        .sync({ force: false })
        .then(() => {
            logger.info("Database connection success");
        })
        .catch((err) => {
            logger.error("Database connection failed:", err);
        });

    /**
     * User Signin / Login
     */
    // Authenticate
    app.use("/api/auth/*", ExpressAuth(authConfig));

    /**
     * For GET and POST of Request / Profile / Review
     */
    app.use("/api/requests", RequestRouter);
    app.use("/api/students", StudentRouter);
    app.use("/api/schools", SchoolRouter);
    app.use("/api/consumers", ConsumerRouter);
    app.use("/api/student-reviews", StudentReviewRouter);
    app.use("/api/academic-histories", AcademicHistoryRouter);
    app.use("/api/exam-histories", ExamHistoryRouter);
    app.use("/api/corporations", CorporationRouter);
    app.use("/api/corporation-reviews", CorporationReviewRouter);

    /**
     * Verification router
     */
    app.use("/api/verification", VerificationRouter);
    /**
     * Recommendation server of meilisearch
     */
    app.use("/api/recommend", RecommendRouter);

    /**
     * For chatting
     */
    // Init dummy chat data
    chatTest();
    // Alarm and Chat data
    app.use("/api/sse", SSEAlarmRouter);
    app.use("/api/message", ChatRouter);

    // Tspec document (API document middleware)
    app.use(
        "/docs",
        await TspecDocsMiddleware({
            debug: true,
            specPathGlobs: ["./node_modules/api_spec/dist/esm/index.d.ts"],
        }),
    );

    app.use(ErrorMiddleware);

    const httpServer = createServer(app);
    // Init socket.io server
    const io = initChat(httpServer);

    // Listen server
    httpServer.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
};

initServer();
