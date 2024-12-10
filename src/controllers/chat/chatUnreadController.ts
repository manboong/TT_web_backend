import mongoose, { Types, HydratedDocument } from "mongoose";
import * as ChatModels from "../../models/chat";
import { IChatContent, IChatroom } from "../../types/chat/chatSchema.types";
import { pushSendAlarm, pushUpdateChatRoom } from "./messageQueue";
import logger from "../../utils/logger";
const { Unread, ChatUser, ChatRoom } = ChatModels;

export const updateUserUnreadByUUID = async (
    uuid: Types.UUID,
    chatRoomId: Types.ObjectId,
    seq: number,
) => {
    await Unread.findOneAndUpdate(
        { chatroom: chatRoomId, user_id: uuid },
        { last_read_seq: seq },
    );
};

export const updateUserUnread = async (
    chatUserId: Types.ObjectId,
    chatRoomId: Types.ObjectId,
    seq: number,
) => {
    const chatUser = await ChatUser.findById(chatUserId);
    if (chatUser === null) {
        return;
    }

    await Unread.findOneAndUpdate(
        { chatroom: chatRoomId, user_id: chatUser.user_id },
        { last_read_seq: seq },
    );
};

export const updateUsersUnreads = async (objectIds: ObjectId[]) => {
    const uuids = await ChatUser.find({ _id: { $in: objectIds } }).get(
        "user_id",
    );
};

export const getUnreadSequences = async (chatRoom: mongoose.Types.ObjectId) => {
    const unreadSequences = (await Unread.find({ chatroom: chatRoom })).map(
        (val) => val.last_read_seq,
    );

    return unreadSequences;
};

export const getUnreadCountOfUser = async (uuid: mongoose.Types.UUID) => {
    const userUnreads = await Unread.find({ user_id: uuid });
    const chatRoomIds = userUnreads.map((unread) => unread.chatroom);
    const chatRooms = await ChatRoom.find({ _id: { $in: chatRoomIds } });

    let ret = 0;
    chatRooms.forEach((chatRoom) => {
        const found = userUnreads.find(
            (unread) =>
                unread.chatroom._id.toString() === chatRoom._id.toString(),
        );
        if (found === undefined || found.last_read_seq === -1) {
            ret += chatRoom.message_seq;
        } else {
            ret += chatRoom.message_seq - found.last_read_seq;
        }
    });

    return ret;
};

export const whetherSendAlarm = async (
    chatRoom: HydratedDocument<IChatroom>,
    message: HydratedDocument<IChatContent>,
    participant_ids: mongoose.Types.UUID[],
    chatUsersIds: ObjectId[],
) => {
    participant_ids.map(async (uuid) => {
        const chatUser = await ChatUser.findOne({ user_id: uuid });
        logger.debug(`WhethersendAlarm: ${chatUser}:${message}`);

        if (chatUser !== null) {
            const isParticipated = chatUsersIds.find(
                (userId) => userId === chatUser._id.toString(),
            );

            logger.debug(`push update chat room:, ${chatUser}`);
            if (isParticipated === undefined) {
                pushUpdateChatRoom(chatRoom, message, chatUser);
            }
        } else {
            logger.debug("push alarm");
            pushSendAlarm(chatRoom, message, uuid);
        }
    });
};
