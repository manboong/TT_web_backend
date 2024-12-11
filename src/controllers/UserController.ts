import sequelize from "sequelize";
import { User } from "../models/rdbms/User";
import { Consumer } from "../models/rdbms/Consumer";

export const getUserByName = async (username: string) => {
    const userProfile = await User.findOne({
        where: { username: username },
    });

    return userProfile;
};

export const getUserById = async (uuid) => {
    const user = await User.findByPk(uuid);
    console.log("getUserById ", uuid, user);
    return user;
};

export const getUsersById = async (uuids: (typeof DataTypes.UUID)[]) => {
    const users = await User.findAll({ where: { user_id: uuids } });

    return users;
};

export const getUserByConsumerId = async (consumerId: number) => {
    const consumer = (
        await Consumer.findOne({
            where: { consumer_id: consumerId },
        })
    )?.get({ plain: true });

    if (consumer === undefined) {
        return undefined;
    }

    const user = (
        await User.findOne({
            where: { user_id: consumer.user_id },
        })
    )?.get({ plain: true });

    return user;
};
