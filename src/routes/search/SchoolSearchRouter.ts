import express, { Request, Response } from "express";
import MeiliSearch from "meilisearch";
import { APISpec } from "api_spec";
import logger from "../../utils/logger";
const client = new MeiliSearch({
    host: "http://127.0.0.1:7700",
    apiKey: "1zBmtAMDjgWPGLcTPAhEy-kRZv44BzxywQ1UHPkIYE0",
});

const SchoolSearchRouter = express.Router();

SchoolSearchRouter.get("/" satisfies keyof APISpec.SearchSchoolAPISpec, (async (
    req,
    res,
) => {
    const { country_code } = req.query;

    const index = client.index(`school-name-${country_code}`);

    try {
        const school = await index.getDocuments();

        res.json({
            response: "ok",
            ret: school,
        });
    } catch (error) {
        logger.error(`School search failed ${error}`);
    }

    return;
}) as APISpec.SearchSchoolAPISpec["/"]["get"]["__handler"]);

export default SchoolSearchRouter;
