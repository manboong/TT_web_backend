import express, { Request, Response } from "express";
import { Consumer } from "../models/rdbms/Consumer";
import { Corporation } from "../models/rdbms/Corporation";
import * as CorpController from "../global/corpInfo/kr/CorpInfoController";

const CorporationRouter = express.Router();

CorporationRouter.get("/", async (req: Request, res: Response) => {
    try {
        const consumer_id = req.query.consumer_id;
        const consumer = await Consumer.findOne({
            where: { consumer_id },
            attributes: ["corp_id"],
        });

        const corporation = consumer
            ? await Corporation.findOne({
                  where: { corp_id: consumer.dataValues.corp_id },
              })
            : null;

        res.json(corporation?.dataValues);
        console.log(corporation?.dataValues);
    } catch (err) {
        console.error(err);
    }
});

CorporationRouter.get("/corpProfile", async (req: Request, res: Response) => {
    const corpNum = req.query.corpNum;

    const storedCorpProfile = await CorpController.findCorpProfileByCorpNum(
        Number(corpNum),
    );

    if (storedCorpProfile === undefined) {
        const externCorpProfile = await CorpController.externReqCorpProfile(
            Number(corpNum),
        );

        if (externCorpProfile === undefined) {
            res.json({ status: "Extern API error", profile: undefined });
        }

        res.json({ status: "not exist", profile: externCorpProfile });
    } else {
        res.json({ status: "exist", profile: storedCorpProfile });
    }
});

CorporationRouter.post("/corpProfile", async (req: Request, res: Response) => {
    const corpData = req.body;

    const createdCorpProfile = await CorpController.createCorpProfile(corpData);

    res.json(createdCorpProfile);
});

CorporationRouter.get("/:corp_id", async (req: Request, res: Response) => {
    const corpId = req.params.corp_id;

    const ret = await CorpController.findCorpProfileByCorpId(Number(corpId));
    console.log(ret);

    res.json(ret);
});

export default CorporationRouter;
