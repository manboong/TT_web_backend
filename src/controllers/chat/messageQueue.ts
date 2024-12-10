import * as ChatModels from "../../models/chat";
import { Queue, Worker, QueueEventsProducer } from "bullmq";
import mongoose from "mongoose";
import {
    IChatroom,
    IChatContent,
    IChatUser,
} from "../../types/chat/chatSchema.types";
import logger from "../../utils/logger";

const { ChatRoom, ChatContent } = ChatModels;

// Some user sent message at specific chatroom
// Server will record sent messages at database
// Finally server will broadcast saved message to users who paticipate in chatroom
const sentMessageQueue = new Queue("userSentMessage");
const chatEventProducer = new QueueEventsProducer("userSentMessage");

// User will ack to server that "I have received a message and updated last sequence"
// Until then server will wait about 1s until ack message from users
// If not there are two options
// 1st is when user is connected with server through websocket.
// - e.g. when user is in different room
// - In this case we can send user that update chat room unread by using "updateChatRoomQueue"
// 2nd is when user is offline
// - In this case we should send alaram (for mobile device) and sse (for web) by using "sendAlarmQueue"
const updateChatRoomQueue = new Queue("updateChatRoom");
const updateChatRoomProducer = new QueueEventsProducer("updateChatRoom");

const sendAlarmQueue = new Queue("sendAlarm");
const sendAlarmProducer = new QueueEventsProducer("sendAlarm");

export interface messageQueueDataTypes {
    chatRoom: IChatroom;
    message: IChatContent;
    sender: IChatUser;
}

export type updateChatRoomDataType = messageQueueDataTypes;

export type sendAlarmDataType = messageQueueDataTypes;

export const pushSendAlarm = async (
    chatRoom: IChatroom,
    message: IChatContent,
    userUUID: mongoose.Types.UUID,
) => {
    logger.debug(`push alaram: ${userUUID.toString("hex")}`);
    sendAlarmProducer.publishEvent({
        eventName: userUUID.toString("hex"),
        jobId: "",
        returnvalue: JSON.stringify(message),
    });
};

export const pushUpdateChatRoom = async (
    chatRoom: IChatroom,
    message: IChatContent,
    chatUser: IChatUser,
) => {
    logger.debug(`Update producer ${chatRoom}, ${chatUser._id.toString()}`);
    updateChatRoomProducer.publishEvent({
        eventName: chatUser._id.toString(),
        jobId: "",
        returnvalue: JSON.stringify({ message: message, chatUser: chatUser }),
    });
};

export const pushMessageQueue = async (
    chatRoom: IChatroom,
    message: IChatContent,
    sender: IChatUser,
) => {
    const data: messageQueueDataTypes = {
        chatRoom: chatRoom,
        message: message,
        sender: sender,
    };
    const jobName = `${sender._id.toString()}:${chatRoom._id.toString()}`;
    await sentMessageQueue.add(jobName, data);
};

const userSentWorker = new Worker(
    "userSentMessage",
    async (job) => {
        const data = job.data as messageQueueDataTypes;

        const chatRoom = await ChatRoom.findByIdAndUpdate(data.chatRoom, {
            $inc: { message_seq: 1 },
        });
        // JSON.stringfied Buffer to buffer
        if (!(data.sender.user_id instanceof Buffer)) {
            data.sender.user_id = Buffer.from(data.sender.user_id);
        }
        logger.debug(`userSentWorker: ${data}`);
        const ret = await ChatContent.create({
            sender_id: data.sender.user_id,
            content: data.message,
            chatroom: chatRoom,
            seq: chatRoom?.message_seq,
        });
        return JSON.stringify(ret.toJSON());
    },
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
        },
    },
);

// TODO: error 처리 등을 위한 hook 코드 작성
userSentWorker.on("completed", (job) => {
    chatEventProducer.publishEvent({
        eventName: job.name,
        jobId: job.id,
        returnvalue: job.returnvalue,
    });
    logger.debug(`${job.id} has completed! ${job.name}`);
});

userSentWorker.on("failed", (job, err) => {
    logger.debug(`${job.id} has failed with ${err.message}`);
});
