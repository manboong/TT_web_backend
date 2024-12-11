import { getRecommendedRequestByStudent } from "../../controllers/wiip/RequestController";
import { getRecommendedStudentByRequest } from "../../controllers/wiip/StudentController";
import express, { Request, Response } from "express";
import { APISpec } from "api_spec";
import logger from "../../utils/logger";
const RecommendRouter = express.Router();

RecommendRouter.post(
    "/students" satisfies keyof APISpec.RecommendAPISpec,
    (async (req, res) => {
        logger.info("recommend router of student");

        const result = await getRecommendedStudentByRequest(
            req.body.student_id,
        );

        const ret = result.getOrNull();

        res.json(ret);
    }) as APISpec.RecommendAPISpec["/students"]["post"]["__handler"],
);

RecommendRouter.post(
    "/requests" satisfies keyof APISpec.RecommendAPISpec,
    (async (req, res) => {
        if (req.body.request_id === undefined) {
            res.json({});
        }
        const ret = await getRecommendedRequestByStudent(req.body.request_id);

        res.json(ret);
    }) as APISpec.RecommendAPISpec["/requests"]["post"]["__handler"],
);

export default RecommendRouter;
