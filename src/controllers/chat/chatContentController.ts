import mongoose, { Types } from "mongoose";
import * as ChatModels from "../../models/chat";
import type { UserAttributes } from "../../models/User";
import { pushMessageQueue } from "./messageQueue";
import logger from "../../utils/logger";

const { ChatUser, ChatContent, ChatRoom } = ChatModels;

export const sendMessage = async (
    chatRoomId: mongoose.Types.ObjectId,
    sender: mongoose.Types.ObjectId,
    message: string,
) => {
    logger.debug(
        `Send message: ChatRoomId: ${chatRoomId}, Sender: ${sender}, Message: ${message}`,
    );

    if (sender === null) {
        throw Error("User not exist in Mongodb");
        return;
    }

    await pushMessageQueue(chatRoomId, message, sender);
};

export const getChatRoomMessages = async (
    chatRoomId: mongoose.Types.ObjectId,
) => {
    const messages = await ChatContent.find({ chatroom: chatRoomId });

    return messages;
};

export const getChatRoomMessagesOfUser = async (
    chatRoomId: mongoose.Types.ObjectId,
    mongoUser: mongoose.Types.ObjectId,
) => {
    const messages = await ChatContent.find({ chatroom_id: chatRoomId });

    return messages;
};

export const getChatRoomMessagesBySeq = async (
    chatroom: mongoose.Types.ObjectId,
    last_seq: number,
) => {
    const messages = await ChatContent.find({ chatroom: chatroom }).gte(
        "seq",
        last_seq,
    );

    return messages;
};

export const getChatRoomLastMessage = async (chatRoomId: Types.ObjectId) => {
    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (chatRoom === null) {
        return "";
    }

    const message = await ChatContent.findOne({
        $and: [{ chatroom: chatRoom }, { seq: chatRoom.message_seq - 1 }],
    });

    return message;
};

// TODO: deprecated
export const getChatRoomMessagesBiz = async (
    chatRoomId: mongoose.Types.ObjectId,
    user: UserAttributes,
) => {
    const mongoUser = await ChatUser.findOne({ user_id: user.user_id });
    if (mongoUser === null) {
        throw Error("User not exist in Mongodb");
    }
    const messages = await ChatContent.find({ chatroom: chatRoomId });
    if (messages === null) return [];

    const filteredMessages = messages.map((val) => {
        return {
            message: val.message,
            direction: mongoUser._id.equals(val.sender_id)
                ? "outgoing"
                : "incoming",
            createdAt: val.created_at,
        };
    });

    return filteredMessages;
};
