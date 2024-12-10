import mongoose, { Schema, Types } from "mongoose";
// Unread schema is for displaying status of chatroom and push alarm.
// Ex) When user entered chatroom pages users will see last sent message and count of unread message
// unread schema uses user_id && chatroom_id as indexes. Which means this schema is per (user and chatroom) not per message;
interface UnreadInfoPerChatroom {
    count: Number;
    // lastSentMessage### are for displaying last message and user alarm.
    lastSentMessage?: mongoose.Types.ObjectId;
    lastSentMessageContent: String;
    lastSentMessageTime: Date;
    lastSentMsesageSender: String;
}

const unreadSchema = new Schema(
    {
        chatroom: { type: Schema.Types.ObjectId, required: true },
        user_id: { type: Types.UUID, required: true },
        send_alarm: { type: Schema.Types.Boolean, default: true },
        // last_read_message_seq is for calculating unread messages
        last_read_at: { type: Date },
        last_read_seq: { type: Number, required: true, default: -1 },
    },
    {
        collection: "unreads",
    },
);

const Unread = mongoose.model("unreads", unreadSchema);

export default Unread;
