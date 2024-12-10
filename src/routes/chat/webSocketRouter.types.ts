import { Types } from "mongoose";

export interface resMessage {
    _id: Types.ObjectId;
    seq: number;
    chatRoomId: string;
    unreadCount: number;
    senderName: string;
    contentType: "text";
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface reqTryJoinProps {
    // last message sequence number of user device
    // last sequence may different by devices
    deviceLastSeq: number;
    chatRoomId: string;
}

export interface resTryJoinProps {
    messages: resMessage[];
}

export interface ackLastSeqProps {
    lastSeq: number;
    chatRoomId: string;
}

export interface resSomeoneSent {
    id: Types.ObjectId;
    lastReadSeq: number;
}

export interface reqSendMessage {
    message: resMessage;
}

export interface resMessages {
    messages: resMessage[];
}
