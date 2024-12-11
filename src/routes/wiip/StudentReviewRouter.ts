import express, { Request, Response } from "express";
import { StudentReview } from "../../models/rdbms/StudentReview";
import { Request as RequestModel } from "../../models/rdbms/Request";
import { Consumer } from "../../models/rdbms/Consumer";

const StudentReviewRouter = express.Router();

StudentReviewRouter.get("/:student_id", async (req: Request, res: Response) => {
    try {
        const student_id = req.params.consumer_id;

        const studentReviews = await StudentReview.findAll({
            where: { student_id },
        });

        const reviewData = await Promise.all(
            studentReviews.map(async (review) => {
                const reviewValues = review.dataValues;

                const request = await RequestModel.findOne({
                    where: { request_id: reviewValues.request_id },
                    attributes: [
                        "title",
                        "subtitle",
                        "reward_price",
                        "currency",
                        "address",
                        "start_date",
                    ],
                });

                return {
                    ...reviewValues,
                    request_card: request ? request.dataValues : null,
                };
            }),
        );

        res.json(reviewData);
    } catch (error) {
        console.error("Error fetching student reviews:", error);
        res.status(500).json({ error: "Failed to fetch student reviews" });
    }
});

StudentReviewRouter.post("/", async (req: Request, res: Response) => {
    try {
        const { consumer_id, student_id, request_id, ...reviewData } = req.body;

        const request = await RequestModel.findOne({
            where: { request_id },
            attributes: ["student_id"],
        });

        const createdReview = await StudentReview.create({
            consumer_id,
            student_id,
            request_id,
            ...reviewData,
        });

        res.status(201).json({ success: true, review: createdReview });
    } catch (error) {
        console.error("Error creating student review:", error);
        res.status(500).json({ error: "Failed to create student review" });
    }
});

export default StudentReviewRouter;
