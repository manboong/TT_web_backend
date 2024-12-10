import { Sequelize } from "sequelize";
import { initModels } from "./init-models";
import logger from "../../utils/logger";

const config = {
    development: {
        username: "root",
        password: null,
        database: "tektonian",
        host: "127.0.0.1",
        dialect: "mysql",
    },
    test: {
        username: "root",
        password: null,
        database: "database_test",
        host: "127.0.0.1",
        dialect: "mysql",
    },
    production: {
        username: "root",
        password: null,
        database: "database_production",
        host: "127.0.0.1",
        dialect: "mysql",
    },
};

export const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE!,
    process.env.MYSQL_USER!,
    process.env.MYSQL_PASSWORD!,
    {
        dialect: "mysql",
        logging: (msg) => logger.debug(msg),
        logQueryParameters: true,
    },
);

export const models = initModels(sequelize);
