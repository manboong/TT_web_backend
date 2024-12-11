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
            req.body.request_id,
        );

        const ret = result.getOrNull();

        res.json(ret);
    }) as APISpec.RecommendAPISpec["/students"]["post"]["__handler"],
);

RecommendRouter.post(
    "/requests" satisfies keyof APISpec.RecommendAPISpec,
    (async (req, res) => {
        if (req.body.student_id === undefined) {
            res.json({});
            return;
        }
        const ret = await getRecommendedRequestByStudent(req.body.student_id);

        res.json(ret);
        return;
    }) as APISpec.RecommendAPISpec["/requests"]["post"]["__handler"],
);

export default RecommendRouter;
