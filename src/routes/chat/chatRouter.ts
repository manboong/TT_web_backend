/**
 * Router regarding chattings.
 * such as, unread message count and information about current chatrooms
 */
import { models } from "../../models/rdbms";
import { createChatRoom } from "../../controllers/chat/chatRoomController";
import { getUserByConsumerId } from "../../controllers/UserController";
import { Router } from "express";
import { getUnreadCountOfUser } from "../../controllers/chat/chatUnreadController";
import { model } from "mongoose";
const ChatRouter = Router();

ChatRouter.post("/unread", async (req, res) => {
    const sessionUser = res.session.user;
    if (sessionUser === undefined) res.json("No session");

    const ret = await getUnreadCountOfUser(sessionUser.id);

    res.json({ unreadCount: ret });
});

ChatRouter.post("/chatroom", async (req, res) => {
    const { request_id } = req.body;
    const sessionUser = res.session.user;

    if (sessionUser === undefined) {
        res.json({ response: "No session" });
        return;
    } else if (!sessionUser.roles.includes("student")) {
        res.json({ response: "No student user" });
        return;
    }

    const userInstance = (
        await models.User.findOne({
            where: { user_id: sessionUser.id },
        })
    )?.get({ plain: true });

    const reqeustInstance = (
        await models.Request.findOne({
            where: { request_id: request_id },
            include: {},
        })
    )?.get({ plain: true });

    if (userInstance === undefined || reqeustInstance === undefined) {
        res.json({ response: "Db error" });
        return;
    }

    const consumerInstance = await getUserByConsumerId(
        reqeustInstance.consumer_id,
    );

    if (consumerInstance === undefined) {
        res.json({ response: "Db error" });
        return;
    }

    const chatRoom = await createChatRoom(reqeustInstance, consumerInstance, [
        consumerInstance,
        userInstance,
    ]);

    res.json({ response: "ok" });
    return;
});

ChatRouter.post("/chatRooms", async (req, res, next) => {
    const sessionUser = res.session.user;
    if (sessionUser === undefined) res.json("No session");
    const dbUserData = await models.User.findOne({
        where: { email: sessionUser.email },
        attributes: ["user_id", "username", "email"],
    });
    const chatRooms =
        await chatController.chatRoomController.getAllChatRoomsByUser(
            dbUserData?.dataValues,
        );

    const ResChatRoomFactory = async (chatRoom: IChatroom): ResChatRoom => {
        const consumer = await chatController.chatUserController.getUserByUUID(
            chatRoom.consumer_id,
        );
        const participants =
            await chatController.chatUserController.getUsersByUUID(
                chatRoom.participant_ids,
            );
        const consumerName = consumer?.username;
        const participantNames = participants.map((part) => part.username);
        const resChatroom: ResChatRoom = {
            chatRoomId: chatRoom._id.toString(),
            messageSeq: chatRoom.message_seq,
            consumerName: consumerName,
            providerNames: participantNames,
        };

        return resChatroom;
    };

    const resChatRooms = await Promise.all(
        chatRooms.map((chatRoom) => ResChatRoomFactory(chatRoom)),
    );
    res.json(resChatRooms);
});

export default ChatRouter;
