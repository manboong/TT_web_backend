import express, { Request, Response } from "express";
import { createCorporationReview } from "../../controllers/CorporationReveiwController";
import { getStudentByUserId } from "../../controllers/wiip/StudentController";
import { getUserByName } from "../../controllers/UserController";

const CorporationReviewRouter = express.Router();

CorporationReviewRouter.post("/", async (req: Request, res: Response) => {
    const request_id = req.body.request_id;
    const review_body = req.body;
    const username = res.session?.user.name ?? null;
    const user = await getUserByName(username);
    const user_id = user?.get({ plain: true }).user_id;
    const student = await getStudentByUserId(user_id);
    const student_id = student ? student.get({ plain: true }).student_id : null;

    if (!student_id) {
        console.log("user is not student");
        return;
    }

    const fullreview = {
        request_id: request_id,
        student_id: student_id,
        ...review_body,
    };

    console.log(fullreview);

    const ret = await createCorporationReview(fullreview);

    if (ret === null) {
        res.status(500).json({ message: "Internal Server Error" });
    } else {
        res.status(201).json({
            message: "Corp Review created successfully",
            student: ret,
        });
    }
});

export default CorporationReviewRouter;
