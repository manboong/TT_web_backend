import express, { Request, Response } from "express";
import { School } from "../../models/rdbms/School";

const SchoolRouter = express.Router();

SchoolRouter.all("/", async (req: Request, res: Response) => {
    try {
        const school = await School.findAll({
            attributes: ["school_id", "school_name_glb", "school_name"],
        });
        res.json(school);
    } catch (err) {
        console.error(err);
    }
});

export default SchoolRouter;
