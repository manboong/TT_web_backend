import mongoose, { Schema, Types } from "mongoose";

const chatRoomSchema = new Schema(
    {
        request_id: { type: Number, required: true },
        consumer_id: { type: Schema.Types.UUID, required: true },
        participant_ids: { type: [Types.UUID], required: true },
        message_seq: { type: Number, default: 0 },
        title: { type: String, default: "" },
    },
    {
        collection: "chat_rooms",
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

const ChatRoom = mongoose.model("chat_rooms", chatRoomSchema);

export default ChatRoom;
