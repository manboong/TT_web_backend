import mongoose, { Schema, Types } from "mongoose";

const chatContentSchema = new Schema(
    {
        chatroom: { type: Schema.Types.ObjectId, required: true },
        seq: { type: Number, required: true, default: 0 },
        content_type: { type: String, default: "text" },
        content: { type: String, default: "" },
        sender_id: { type: Schema.Types.UUID },
        image_url: { type: String, default: "" },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
        collection: "chat_contents",
    },
);

const ChatContent = mongoose.model("chat_contents", chatContentSchema);

export default ChatContent;
