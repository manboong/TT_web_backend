import { createHash } from "crypto";
import { QueueEvents } from "bullmq";
import { HydratedDocument } from "mongoose";
import { Server } from "socket.io";

import { currentSession } from "../../middleware/auth.middleware";
import { chatController } from "../../controllers/chat";
import * as UserController from "../../controllers/UserController";
import { ChatContent } from "../../models/chat";

import logger from "../../utils/logger";
import { APIType } from "api_spec";

import type { Socket } from "socket.io";
// TODO: remove
import type {
    reqTryJoinProps,
    resMessage,
    resSomeoneSent,
} from "./webSocketRouter.types";
import { ISessionUser } from "../../config/auth.types";

const ResChatRoomFactory = async (
    chatRoom: HydratedDocument<IChatroom>,
): Promise<ResChatRoom> => {
    logger.debug(`ResChatRoomFactory: ${chatRoom.toJSON()}`);

    const chatRoomJSON = chatRoom.toJSON();

    const consumer = (
        await UserController.getUserById(Buffer.from(chatRoomJSON.consumer_id))
    )?.get({ plain: true });

    const usersUUIDs = chatRoomJSON.participant_ids.map((id) =>
        Buffer.from(id),
    );
    const participantsInst = await UserController.getUsersById(usersUUIDs);

    const participants = participantsInst.map((inst) =>
        inst.get({ plain: true }),
    );
    const lastMessage =
        await chatController.chatContentController.getChatRoomLastMessage(
            chatRoom._id,
        );

    const participantsRes = participants.map((part) => {
        return {
            // IMPORTANT
            // _id: "" <- user's chat id should not respond
            username: part.username,
            user_id: createHash("sha256")
                .update(part.user_id.toString("hex"))
                .digest("hex"),
            email: part.email,
            image_url: part.image,
        };
    });
    const consumerName = consumer?.username;
    const participantNames = new Set(participants.map((part) => part.username));
    const resChatroom: ResChatRoom = {
        chatRoomId: chatRoom._id.toString(),
        messageSeq: chatRoom.message_seq,
        consumerName: consumerName,
        providerNames: Array.from(participantNames),
        participants: participantsRes,
        lastSender: "",
        lastMessage: lastMessage?.content,
        lastSentTime: lastMessage?.created_at,
    };
    return resChatroom;
};

const ResMessageFactory = (
    message: HydratedDocument<IChatContent>,
    direction: "outgoing" | "inbound",
): resMessage => {
    let ret: resMessage;
    const senderJSON = message.toJSON().sender_id;
    const senderId = createHash("sha256")
        .update(Buffer.from(senderJSON).toString("hex"))
        .digest("hex");

    ret = {
        _id: message._id,
        seq: message.seq,
        chatRoomId: message.chatroom._id.toString(),
        contentType: "text",
        content: message.content,
        senderId: senderId,
        direction: direction,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    logger.debug(`Processing Message: ${message} ${ret}`);
    return ret;
};

const ResMessagesFactory = (
    messages: HydratedDocument<IChatContent>[],
    chatUser: HydratedDocument<IChatUser>,
): resMessage[] => {
    // TODO: bit wise operation later
    let ret: resMessage[] = [];
    for (let message of messages) {
        const dir =
            message.sender_id.toString("hex") ===
            chatUser.user_id.toString("hex")
                ? "outgoing"
                : "inbound";
        ret.push(ResMessageFactory(message, dir));
    }
    logger.debug(`Message ret: ${ret}`);
    return ret;
};

// See pushUpdateChatRoom function in messageQueue.ts file
async function updateChatRoomHandler(globalArgs, { jobId, returnvalue }) {
    const { socket } = globalArgs;
    const { message, chatUser } = JSON.parse(returnvalue);
    const ret = {
        _id: message._id,
        seq: message.seq,
        chatRoomId: message.chatroom,
        contentType: "text",
        content: message.content,
        senderName: chatUser.username ?? "",
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    logger.debug(`Update Room handler: ${ret}`);
    socket.emit("updateChatRoom", JSON.stringify(ret));
}

async function sendMessageHandler(globalArgs, recv) {
    logger.debug(`Send message Handler: Received: ${recv}`);
    const { socket, chatContentController } = globalArgs;
    const req = JSON.parse(recv);
    const chatRoom = socket.data.chatRoom;
    const chatUser = socket.data.chatUser;
    logger.debug(
        `Send message Handler: chatRoom: ${chatRoom}, chatUser: ${chatUser}`,
    );

    // Check sender's temporary id is same as chatUser id
    if (req.senderId !== chatUser._id.toString()) {
        // TODO: add throw error
        return;
    }

    await chatContentController.sendMessage(
        chatRoom._id,
        chatUser,
        req.message.content,
    );
}

async function updateLastReadHandler(globalArgs, recv) {
    const { socket, chatUnreadController } = globalArgs;
    const { lastSeq } = recv;
    const chatUser = socket.data.chatUser;
    const chatRoom = socket.data.chatRoom;
    chatUnreadController.updateUserUnreadByUUID(
        chatUser.user_id,
        chatRoom,
        lastSeq,
    );
}

async function userTryUnJoinHandler(globalArgs) {
    const { socket, userSentEvent } = globalArgs;
    // 4. server send last read sequences of users
    //socket.in(chatRoomId).emit("unreadSeq");

    // when user leavs chatroom
    const chatRoom = socket.data.chatRoom;
    const chatUser = socket.data.chatUser;
    if (chatRoom !== null) {
        logger.debug(
            `User leave room: User: ${chatUser}, ChatRoom: ${chatRoom}`,
        );
        userSentEvent.off(
            `${socket.data.chatUser._id.toString()}:${socket.data.chatRoom._id.toString()}`,
            userSentEventHandler,
        );
        socket.leave(chatRoom._id);
    }
}

async function socketDisconnectHandler(globalArgs, reason) {
    const { socket, userSentEvent, updateChatRoomEvent, chatUserController } =
        globalArgs;
    const chatUser = socket.data.chatUser;
    logger.debug(
        `User disconnected: User: ${socket.data.chatUser} Reason: ${reason}`,
    );

    await chatUserController.delChatUserById(chatUser._id);
}

async function userSentEventHandler(
    globalArgs,
    {
        jobId,
        returnvalue, // JSON.stringfied IChatContent
    },
) {
    const { io, socket, chatUnreadController } = globalArgs;
    const chatRoom = socket.data.chatRoom;
    const chatUser = socket.data.chatUser;
    const participant_ids = chatRoom.participant_ids;
    // 2. emit user "otherSent"
    // and server waits for users' "updateLastRead"
    logger.debug(`User Sent Event: Return Value: ${JSON.parse(returnvalue)}`);
    const returnObject = JSON.parse(returnvalue);
    const objectDocument = new ChatContent({
        ...returnObject,
        sender_id: Buffer.from(returnObject.sender_id.data),
    });

    const othersRes: Promise<resSomeoneSent[]> = socket
        .in(chatRoom._id.toString())
        .timeout(500)
        .emitWithAck(
            "someoneSent",
            JSON.stringify(ResMessageFactory(objectDocument, "inbound")),
        );

    const senderRes: Promise<resSomeoneSent> = socket.emitWithAck(
        "someoneSent",
        JSON.stringify(ResMessageFactory(objectDocument, "outgoing")),
    );

    const responses = [...(await othersRes), await senderRes];

    const respondUserIds = responses.map((res) => res.id);

    await Promise.all(
        responses.map(async (res) => {
            return chatUnreadController.updateUserUnread(
                res.id,
                chatRoom,
                res.lastReadSeq,
            );
        }),
    );

    const lastReadSequences =
        await chatUnreadController.getUnreadSequences(chatRoom);

    io.in(chatRoom._id.toString()).emit("updateUnread", lastReadSequences);
    // 3. user response that I have read a message so update last read
    // If no response then don't update last read
    logger.debug(`SomeoneSent: Response: ${responses}`);
    logger.debug(`SomeoneSent: Return Value: ${returnvalue}`);

    await chatUnreadController.whetherSendAlarm(
        chatRoom,
        JSON.parse(returnvalue),
        participant_ids,
        respondUserIds,
    );
}

async function userTryJoinHandler(globalArgs, req: reqTryJoinProps) {
    const {
        io,
        socket,
        chatRoomController,
        chatUser,
        chatContentController,
        chatUnreadController,
    } = globalArgs;
    const { chatRoomId, deviceLastSeq, id } = req;
    const chatRoom: HydratedDocument<IChatroom> | null =
        await chatRoomController.getChatRoomById(chatRoomId);
    logger.debug(`User Try join: ${req}`);

    // set socket.data if user joined a room
    socket.data.chatRoom = chatRoom;
    socket.data.chatUser = chatUser;

    if (chatRoom === null) {
        return;
        throw new Error(`Room not exist: ${chatRoomId}`);
    }
    // Is he ok to join?
    if (!chatRoom.participant_ids.includes(chatUser.user_id)) {
        return;
        throw new Error("User have no perssion to access a room");
    }
    // Check users temporary id
    if (id !== chatUser._id.toString()) {
        logger.error(`Wrong Chat Id: User: ${chatUser} Id: ${id}`);
        return;
    }

    // received unread messages and update unread schema
    const currChatRoomSeq = chatRoom.message_seq;
    const messages = [] as HydratedDocument<IChatContent>[];
    logger.debug(
        `Last read Sequece: Current: ${currChatRoomSeq}, Device: ${deviceLastSeq}`,
    );
    if (currChatRoomSeq - deviceLastSeq > 0) {
        // get unread messages
        const unreadMessages =
            await chatContentController.getChatRoomMessagesBySeq(
                chatRoom,
                deviceLastSeq,
            );
        messages.push(...unreadMessages);
        // update unread schema
        await chatUnreadController.updateUserUnreadByUUID(
            chatUser.user_id,
            chatRoom._id,
            currChatRoomSeq,
        );
    }
    // get last read sequences
    const lastReadSequences = await chatUnreadController.getUnreadSequences(
        chatRoom._id,
    );

    const resMessages = ResMessagesFactory(messages, chatUser);

    const res = JSON.stringify({
        messages: resMessages,
        lastReadSequences: lastReadSequences,
    });

    try {
        const response = await socket
            .timeout(500)
            .emitWithAck("userJoined", res);
        // join user after acknowledgement
        logger.debug(
            `User joined: ChatRoomId: ${chatRoomId}, Status: ${response}`,
        );
        socket.join(chatRoomId);
        io.in(chatRoom._id.toString()).emit("updateUnread", lastReadSequences);
    } catch (e) {
        // should now reach here
        throw new Error("User couldn't join the room");
    }
}

type Objects = Record<keyof Object, Object>;

type EventHandler<Args extends Objects> = (
    globalArgs: Args,
    ...args: any[]
) => void;

interface Ring<Args extends Objects, Target extends Objects> {
    description: string;
    eventTarget: keyof Target;
    eventName: string | (() => string);
    handler: EventHandler<Args>;
}
interface Chain<Args extends Objects, Target extends Objects>
    extends Ring<Args, Target> {
    chains: Ring<Args, Target>[];
}

interface EventFlow<Args extends Objects, Target extends Objects> {
    globalArgs: Args;
    eventTargets: Target;
    chains: Chain<Args, Target>[] | Ring<Args, Target>[];
}

async function eventRegistHelper<A extends Objects, T extends Objects>(
    eventFlow: EventFlow<A, T>,
) {
    // list ([a]) to object {a: 'a'}
    const globalArgs = eventFlow.globalArgs;
    const eventTargets = eventFlow.eventTargets;
    const chains = eventFlow.chains;
    for (let chain of chains) {
        const target = eventTargets[chain.eventTarget];

        // Check lazy evaluation
        const eventName =
            typeof chain.eventName === "function"
                ? chain.eventName()
                : chain.eventName;

        const action = chain.action;

        const nextChains: undefined | any[] = chain.chains;
        const nextEventFlow = {
            globalArgs: globalArgs,
            eventTargets: eventTargets,
            chains: nextChains,
        };

        // Disconnect
        if (action === "disconnect") {
            await target.disconnect();

            // Check recursive
            if (nextChains !== undefined) {
                await eventRegistHelper(nextEventFlow);
            }
        }
        // Unregist events
        else if (chain.handler === undefined || action === "off") {
            await target.off(eventName);
            // Check recursive
            if (nextChains !== undefined) {
                await eventRegistHelper(nextEventFlow);
            }
        }
        // Regist events
        else {
            // Check recursive
            if (nextChains === undefined) {
                await target.on(
                    eventName,
                    chain.handler.bind(target, globalArgs),
                );
            } else {
                await target.on(eventName, async (...args: any[]) => {
                    await chain.handler.call(target, globalArgs, ...args);
                    await eventRegistHelper(nextEventFlow);
                });
            }
        }
        // If end
    }
    // For end
}

export default function initChat(httpServer) {
    const {
        chatContentController,
        chatRoomController,
        chatUserController,
        chatUnreadController,
    } = chatController;

    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:3000",
            credentials: true,
        },
        path: "/api/chat",
    });

    logger.info("Initialized Socket io");

    // set user and chatroom datas on socket instance
    io.use((socket, next) => {
        // chatRoom will be set 'join' event
        socket.data.chatRoom = null;
        // TODO: should add protocol to get session -> change later
        socket.request.protocol = "ws";
        currentSession(socket.request, socket.request, next);
    });

    io.on("connection", async (socket) => {
        const userSentEvent = new QueueEvents("userSentMessage");
        const updateChatRoomEvent = new QueueEvents("updateChatRoom");
        const sessionUser: ISessionUser = socket.request.session?.user;
        if (sessionUser === undefined) {
            return;
        }
        // When you connected to a chat create one time chatuser identity
        // MEANS!!! that you should not use ObjectId of user
        // TODO: 기기별 1개로 재한 필요함
        // 지금은 채팅 페이지에서 유저가 요청하는데로 생성하고 있음
        let chatUser: HydratedDocument<IChatUser> | null =
            await chatUserController.getChatUserByUUID(sessionUser.id);

        if (chatUser === null) {
            chatUser = await chatUserController.createChatUser({
                user_id: sessionUser.id,
                email: sessionUser.email,
                username: sessionUser.name,
                image: "",
            });
        }

        if (chatUser === null) {
            return;
            throw new Error("User not created");
        }

        // then send user ObjectId to a client, so we can identify user
        try {
            const chatRooms = await chatRoomController.getAllChatRoomsByUser({
                user_id: chatUser.user_id,
            });

            const resChatRooms = await Promise.all(
                chatRooms.map(async (chatRoom) => ResChatRoomFactory(chatRoom)),
            );

            const is_connected = await socket
                .timeout(500)
                .emitWithAck("connected", {
                    id: chatUser._id,
                    chatRooms: resChatRooms,
                });
            logger.info(
                `User try connection: User: ${chatUser}, Result: ${is_connected}`,
            );
        } catch (e) {
            // if no response, disconnect
            socket.disconnect(true);
            await chatUserController.delChatUserById(chatUser._id);
            logger.warn(`User failed to connect: Error: ${e}`);
            return;
        }
        socket.data.chatUser = chatUser;

        /**
         * There could be three types of events. "on" | "off" | "disconnect"
         * All connections are already made so there is no "connect" event
         *
         * Types of three events are as follows
         *
         * "on": handler: Function, action: undefined | "on"
         * "off": handler: undefined, action: undefined | "off"
         * "disconnect": handler: undefined, action: "disconnect"
         *
         * TODO: add error handler later
         */
        const globalArgs = {
            io,
            socket,
            userSentEvent,
            updateChatRoomEvent,
            chatUserController,
            chatRoomController,
            chatUnreadController,
            chatContentController,
            chatUser,
        };
        const eventTargets = {
            socket,
            userSentEvent,
            updateChatRoomEvent,
        };

        const eventRegisterFlow: EventFlow<
            typeof globalArgs,
            typeof eventTargets
        > = {
            globalArgs,
            eventTargets,
            chains: [
                {
                    description: "Events when user try joined",
                    eventTarget: "socket",
                    eventName: "userTryJoin",
                    handler: userTryJoinHandler,
                    chains: [
                        {
                            description:
                                "After user joined a chatroom, the `socket.data.chatRoom` should be set so we will evaluate eventName later",
                            eventTarget: "userSentEvent",
                            eventName: () =>
                                `${socket.data.chatUser._id.toString()}:${socket.data.chatRoom._id.toString()}`,
                            handler: userSentEventHandler,
                        },
                    ],
                },
                {
                    description:
                        "When user leave a chatroom, make user leave a socket room and remove eventlistenr",
                    eventTarget: "socket",
                    eventName: "userTryUnjoin",
                    handler: userTryUnJoinHandler,
                    /*
                    Wrong code
                    chains: [
                        {
                            description:
                                "remove eventlistener of userSentEvent",
                            eventTarget: "userSentEvent",
                            action: "off",
                            eventName: () =>
                                `${socket.data.chatUser._id.toString()}:${socket.data.chatRoom._id.toString()}`,
                        },
                    ],
                    */
                },
                {
                    description: "",
                    eventTarget: "socket",
                    eventName: "updateLastRead",
                    handler: updateLastReadHandler,
                },
                {
                    description: "",
                    eventTarget: "socket",
                    eventName: "sendMessage",
                    handler: sendMessageHandler,
                },
                {
                    description: "",
                    eventTarget: "updateChatRoomEvent",
                    eventName: () => socket.data.chatUser._id.toString(),
                    handler: updateChatRoomHandler,
                },
                {
                    eventTarget: "socket",
                    eventName: "disconnecting",
                    handler: socketDisconnectHandler,
                    chains: [
                        {
                            eventTarget: "userSentEvent",
                            action: "disconnect",
                        },
                        {
                            eventTarget: "updateChatRoomEvent",
                            action: "disconnect",
                        },
                    ],
                },
            ],
        };

        eventRegistHelper(eventRegisterFlow);
    });

    return io;
}
