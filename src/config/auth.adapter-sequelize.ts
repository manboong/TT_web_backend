import type { Adapter } from "@auth/core/adapters";
import { Sequelize } from "sequelize";
import { models } from "../models/rdbms";

import logger from "../utils/logger";

export default function SequelizeAdapter(client: Sequelize): Adapter {
    const { User, Account, VerificationToken, Consumer } = models;

    // TODO: sync function should not be used in production level
    // sync is for development only!!
    let _synced = false;
    const sync = async () => {
        if (process.env.NODE_ENV !== "production" && !_synced) {
            await Promise.all([
                User.sync(),
                Account.sync(),
                VerificationToken.sync(),
            ]);

            _synced = true;
        }
    };
    Account.belongsTo(User, { onDelete: "cascade" });

    return {
        async createUser(user) {
            await sync();
            try {
                const ret = await client.transaction(async (T) => {
                    const userInstance = await User.create(
                        {
                            username: user.name,
                            email: user.email,
                            email_verified: user.emailVerified,
                            image: user.image,
                        },
                        { transaction: T },
                    );
                    const createdUser = await User.findOne({
                        where: { email: user.email },
                        // user_id as id
                        attributes: {
                            exclude: ["user_id"],
                            include: [["user_id", "id"]],
                        },
                        transaction: T,
                    });
                    const consumerInstance = await Consumer.create(
                        {
                            user_id: createdUser?.dataValues.id,
                            consumer_email: createdUser?.dataValues.email,
                            consumer_type: "normal",
                            phone_number: "",
                        },
                        { transaction: T },
                    );
                    return createdUser?.get({ plain: true }) ?? null;
                });
                return ret;
            } catch (e) {
                logger.error(e);
                return null;
            }
        },
        async gerUser(id) {
            await sync();

            const userInstance = await User.findByPk(id, {
                // user_id as id
                attributes: {
                    exclude: ["user_id"],
                    include: [["user_id", "id"]],
                },
            });

            return userInstance?.get({ plane: true }) ?? null;
        },
        async getUserByEmail(email) {
            await sync();

            const userInstance = await User.findOne({
                where: { email },
                // user_id as id
                attributes: {
                    exclude: ["user_id"],
                    include: [["user_id", "id"]],
                },
            });
            return userInstance?.get({ plain: true }) ?? null;
        },
        async getUserByAccount({ provider, providerAccountId }) {
            await sync();
            const accountInstance = await Account.findOne({
                where: { provider, providerAccountId },
                // TODO: No idea strage field are included by default!
                attributes: { exclude: ["UserUserId"] },
            });

            if (!accountInstance) {
                return null;
            }
            const userInstance = await User.findByPk(accountInstance.user_id, {
                // user_id as id
                attributes: {
                    exclude: ["user_id"],
                    include: [["user_id", "id"]],
                },
            });
            const userData = userInstance?.get({ plain: true }) ?? null;
            return userInstance?.get({ plain: true }) ?? null;
        },
        async updateUser(user) {
            await sync();

            await User.update(user, { where: { user_id: user.id } });
            const userInstance = await User.findByPk(user.id);

            return userInstance!.get({ plain: true });
        },
        async deleteUser(userId) {
            await sync();

            const userInstance = await User.findByPk(userId);
            // Consumer data of user will be destroyed automatically
            // On delete casacade
            await User.destroy({ where: { user_id: userId } });

            return userInstance;
        },
        async linkAccount(account) {
            await sync();
            // userId to user_id
            await Account.create({
                user_id: account.userId,
                ...account,
            });
        },
        async unlinkAccount({ provider, providerAccountId }) {
            await sync();

            await Account.destroy({
                where: { provider, providerAccountId },
            });
        },
        async createVerificationToken(
            verificationToken,
            tokenType: string = "email",
        ) {
            await sync();

            verificationToken.token_type =
                verificationToken.token_type ?? tokenType;

            return await VerificationToken.create(verificationToken);
        },
        async useVerificationToken({ identifier, token }) {
            await sync();

            const tokenInstance = await VerificationToken.findOne({
                where: { identifier, token },
            });

            await VerificationToken.destroy({ where: { identifier } });

            return tokenInstance?.get({ plane: true }) ?? null;
        },
    };
}
