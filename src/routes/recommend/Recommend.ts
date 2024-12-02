import express, { Request, Response } from "express";
import { getRecommendedStudentByRequest } from "../../controllers/wiip/StudentInfoController";
import { getRecommendedRequestByStudent } from "../../controllers/wiip/RequestController";

const RecommendRouter = express.Router();

RecommendRouter.post("/students", async (req: Request, res: Response) => {
    const { request_id } = req.body;

    const ret = await getRecommendedStudentByRequest(request_id);

    res.json(ret);
});

RecommendRouter.post("/requests", async (req: Request, res: Response) => {
    if (req.body.request_id === undefined) {
        res.json("");
    }
    const ret = await getRecommendedRequestByStudent(req.body.request_id);

    res.json(ret);
});

export default RecommendRouter;