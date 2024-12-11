import * as ChatModels from "../../models/chat";
import type { UserAttributes } from "../../models/rdbms/User";
import type { RequestAttributes } from "../../models/rdbms/Request";

import logger from "../../utils/logger";

const { ChatRoom, ChatUser, Unread, ChatContent } = ChatModels;

export const createChatRoom = async (
    request: RequestAttributes,
    consumer: UserAttributes,
    participants: UserAttributes[],
) => {
    try {
        const chatRoomInstance = await ChatRoom.create({
            request_id: request.request_id,
            consumer_id: consumer.user_id,
            participant_ids: participants.map((u) => u.user_id),
        });

        const res = await Promise.all(
            participants.map(async (parti) => {
                await Unread.create({
                    chatroom: chatRoomInstance,
                    user_id: parti.user_id,
                });
            }),
        );

        const chatContent = await ChatContent.create({
            chatroom: chatRoomInstance,
            seq: 0,
            content_type: "alert",
            content: "방이 생성되었어요",
            sender_id: null,
            image_url: "",
        });
        return chatRoomInstance;
    } catch (e) {
        logger.warn(`Failed chatroom created ${e}`);
        throw new Error("Create room failed");
    } finally {
        logger.info("ChatRoom created");
    }
};

export const getChatRoomById = async (objectId: string) => {
    return await ChatRoom.findById(objectId);
};

export const getChatRoomsByRequestId = async (requestId: number) => {
    return await ChatRoom.find({ request_id: requestId });
};

export const getAllChatRoomsByUser = async (user: UserAttributes) => {
    return await ChatRoom.find({ participant_ids: user.user_id });
};

export const getAliveChatRoomsByUser = async (user: UserAttributes) => {
    const chatuser = await ChatUser.findOne({ user_id: user.user_id });

    return await ChatRoom.find({
        participant_ids: chatuser.user_id,
        // request_id of chat rooms whose requests are not done yet should be bigger than 0
        request_id: { $gte: 0 },
    });
};

export const delChatRoomsByRequest = async (request: RequestAttributes) => {
    // delete unread
    const chatRooms = await ChatRoom.find({ request_id: request.request_id });
    const chatRoomIds = chatRooms.map((chatRoom) => chatRoom._id);
    await Unread.deleteMany({ chatroom_id: { $in: chatRoomIds } });

    // change request_id: 23 -> -23
    return await ChatRoom.updateMany(
        { request_id: request.request_id },
        { $set: { request_id: -1 * request.request_id } },
    );
};

export const delChatRoom = async (chatRoomId: string) => {
    await ChatRoom.updateOne({ _id: chatRoomId });
};

export const leaveChatRoom = async (chatRoomId: string, userId: string) => {};
