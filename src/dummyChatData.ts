import { models } from "./models/rdbms";
import { chatController } from "./controllers/chat";
import { ChatUser } from "./models/chat";
import { Request } from "./models/rdbms/Request";

import { RequestEnum } from "api_spec/enum";
import logger from "./utils/logger";
import { Op } from "sequelize";
import { Consumer } from "./models/rdbms/Consumer";

const User = models.User;
const { chatRoomController, chatContentController, chatUserController } = chatController;

const dummyMessage: string[] = [
    "Or maybe not, let me check logistics and call you. Give me sometime",
    "Alright",
    "I will look into it",
    "Exactly my point!",
    "Not quite the same.",
    "I thought that the event was over long ago",
    "nothing",
    "sure i'll take it from you",
    "Take care, bye",
    "Not today",
    "Whatever works for you!",
    "Will get in touch",
    "Ok",
] as const;

function randPickOne<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function randPick<T>(items: T[], number: number): T[] {
    let ret = [];
    for (let i = 0; i < number; i++) {
        ret.push(randPickOne(items));
    }
    return ret;
}

async function createAliveChatRoom(request_id: number, consumerUserId: Buffer, providerUserId: Buffer) {
    const chatRoom = await chatRoomController.createChatRoom(request_id, consumerUserId, [
        consumerUserId,
        providerUserId,
    ]);

    const consumer = await chatUserController.createChatUser(consumerUserId);
    const provider = await chatUserController.createChatUser(providerUserId);

    for (let i = 0; i < Math.floor(Math.random() * 13); i++) {
        await chatContentController.sendMessage(
            {
                contentType: "text",
                content: randPickOne(dummyMessage),
            },
            chatRoom!._id,
            randPickOne([consumer!, provider!])._id,
        );
    }
}

const allUsers = await User.findAll({ raw: true });
const allRequests = await Request.findAll({ raw: true });

const genCompleteRequestChatData = async () => {
    const completedRequests = allRequests.filter(
        (val) => val.request_status === RequestEnum.REQUEST_STATUS_ENUM.FINISHED,
    );
};

const genContractedRequestChatData = async () => {
    const contractedRequests = allRequests.filter(
        (val) => val.request_status === RequestEnum.REQUEST_STATUS_ENUM.CONTRACTED,
    );
    contractedRequests.map(async (req) => {
        const participantIds = req.provider_ids;
        const consumer = await Consumer.findOne({ where: { consumer_id: req.consumer_id }, raw: true });

        const studentUsers = await User.findAll({ where: { user_id: participantIds }, raw: true });

        const restStudent = (
            await User.findAll({ where: { user_id: { [Op.notIn]: participantIds } }, raw: true })
        ).filter((val) => val.email.startsWith("student"));

        const providerUsers = [...studentUsers, ...randPick(restStudent, 2)];

        await Promise.all(
            providerUsers.map(async (provider) => {
                createAliveChatRoom(req.request_id, consumer!.user_id, provider.user_id);
            }),
        );

        await chatRoomController.actionCompleteRecruit(
            req.request_id,
            consumer!.user_id,
            studentUsers.map((val) => val.user_id),
        );
    });
};

const genPostedRequestChatData = async () => {
    const postedRequests = allRequests.filter((val) => val.request_status === RequestEnum.REQUEST_STATUS_ENUM.POSTED);

    postedRequests.map(async (req) => {
        const participantIds = req.provider_ids;
        const consumer = await Consumer.findOne({ where: { consumer_id: req.consumer_id }, raw: true });

        const studentUsers = await User.findAll({ where: { user_id: participantIds }, raw: true });

        const restStudent = (
            await User.findAll({ where: { user_id: { [Op.notIn]: participantIds } }, raw: true })
        ).filter((val) => val.email.startsWith("student"));

        const providerUsers = [...studentUsers, ...randPick(restStudent, 2)];

        await Promise.all(
            providerUsers.map(async (provider) => {
                createAliveChatRoom(req.request_id, consumer!.user_id, provider.user_id);
            }),
        );
    });
};

export const chatTest = async () => {
    await genContractedRequestChatData();
    await genPostedRequestChatData();
    await ChatUser.deleteMany();
};
