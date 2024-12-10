import { models, sequelize } from "../../models/rdbms";
import { MeiliSearch } from "meilisearch";
import { Op } from "sequelize";
import { DataTypes } from "sequelize";
import logger from "../../utils/logger";

const client = new MeiliSearch({
    host: "http://127.0.0.1:7700",
    apiKey: "1zBmtAMDjgWPGLcTPAhEy-kRZv44BzxywQ1UHPkIYE0",
});

const requestSearch = client.index("request");
// requestSearch.updateFilterableAttributes(["_geo"]);
// requestSearch.updateSortableAttributes(["_geo"]);

const StudentWithCurrentSchool = models.studentwithcurrentschool;
const RequestModel = models.Request;
const ConsumerModel = models.Consumer;

export const getRecommendedRequestByStudent = async (student_id: number) => {
    const student = (
        await StudentWithCurrentSchool.findOne({
            where: { student_id: student_id },
        })
    )?.get({ plain: true });

    const coordi = JSON.parse(JSON.stringify(student?.coordinate)).coordinates;

    const searchRet = await requestSearch.search("", {
        filter: [`_geoRadius(${coordi[0]}, ${coordi[1]}, 1000000000000)`],
        sort: [`_geoPoint(${coordi[0]}, ${coordi[1]}):asc`],
    });

    return searchRet;
};

export const getRequestByRequestId = async (request_id: number) => {
    const requestBody = await RequestModel.findOne({
        where: { request_id: request_id },
    });
    return requestBody;
};

export const getAllRequest = async () => {
    const requestBody = await RequestModel.findAll({});
    return requestBody;
};

export const createRequest = async (
    uuid: typeof DataTypes.UUID,
    role: "corp" | "orgn" | "normal",
    data,
) => {
    try {
        const ret = await sequelize.transaction(async (t) => {
            const consumerIdentity = (
                await ConsumerModel.findOne({
                    where: {
                        [Op.and]: [{ user_id: uuid }, { consumer_type: role }],
                    },
                    transaction: t,
                })
            )?.get({ plain: true });

            if (consumerIdentity === undefined) {
                throw new Error("No consumer identity exist");
            }

            const createdRequest = await RequestModel.create(
                {
                    ...data,
                    consumer_id: consumerIdentity.consumer_id,
                },
                { transaction: t },
            );

            logger.info(`Request created: ${createRequest}`);

            const coordinate = JSON.parse(
                JSON.stringify(createdRequest.dataValues.address_coordinate),
            ).coordinates;

            const searchRet = await requestSearch.addDocuments(
                [
                    {
                        id: createdRequest.request_id,
                        _geo: { lat: coordinate[0], lng: coordinate[1] },
                        ...createdRequest.dataValues,
                    },
                ],
                { primaryKey: "id" },
            );

            const searchTask = await client.waitForTask(searchRet.taskUid);

            if (searchTask.status !== "succeeded") {
                throw new Error(
                    "No record created! " + JSON.stringify(searchTask),
                );
            }

            return createdRequest.request_id;
        });

        return ret;
    } catch (error) {
        // transaction failed
        logger.error(`Created Request Error: ${error}`);
        return undefined;
    }
};
