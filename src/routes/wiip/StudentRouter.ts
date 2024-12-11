import express, { Request, Response } from "express";
import {
    getStudentFullProfileByStudentId,
    getInstReviewOfStudentByStudentId,
    createUnVerifiedStudentIdentity,
} from "../../controllers/wiip/StudentController";
import { APISpec } from "api_spec";
import { fullstudentprofile } from "../../models/rdbms/fullstudentprofile";
import logger from "../../utils/logger";
import { getRequestByRequestId } from "../../controllers/wiip/RequestController";
import { Corporation } from "../../models/rdbms/Corporation";

const StudentRouter = express.Router();

StudentRouter.post("/", async (req: Request, res: Response) => {
    const sessionUser = res.session?.user ?? undefined;

    if (sessionUser === undefined) {
        res.json("Login first");
        return;
    }

    const ret = await createUnVerifiedStudentIdentity(sessionUser.id, req.body);

    if (ret === undefined) {
        res.status(500).json({ message: "Internal Server Error" });
    } else {
        res.status(201).json({
            message: "Student profile created successfully",
            student: ret,
        });
    }
});

StudentRouter.get(
    "/:student_id" satisfies keyof APISpec.StudentAPISpec,
    (async (req, res) => {
        const { student_id } = req.params;
        const roles: string[] | null = res.session?.user?.roles ?? null;
        // TODO: add response type
        let ret: { profile: any; review: any } = {
            profile: undefined,
            review: [],
        };

        if (student_id === undefined) {
            res.json(ret);
            return;
        }

        const studentFullProfile = await getStudentFullProfileByStudentId(
            Number(student_id),
        );

        if (studentFullProfile === null) {
            res.json(ret);
            return;
        }

        ret.profile = studentFullProfile.get({ plain: true });
        if (
            roles !== null &&
            (roles.includes("corp") || roles.includes("orgn"))
        ) {
            const reviewModels = await getInstReviewOfStudentByStudentId(
                Number(student_id),
            );

            await Promise.all(
                reviewModels.map(async (model) => {
                    const review = model.get({ plain: true });
                    const request = (
                        await getRequestByRequestId(review.request_id)
                    )?.get({ plain: true });
                    let logo_image = "";
                    if (request?.corp_id !== undefined) {
                        logo_image =
                            (
                                await Corporation.findOne({
                                    where: {
                                        corp_id: request.corp_id,
                                    },
                                })
                            )?.get("logo_image", { plain: true }) ?? "";
                    }
                    ret.review.push({
                        ...review,
                        request: request,
                        logo_image,
                    });
                }),
            );
        }

        res.json(ret);
    }) as APISpec.StudentAPISpec["/:student_id"]["get"]["__handler"],
);

export default StudentRouter;