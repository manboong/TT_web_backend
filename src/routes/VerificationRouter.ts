import { createTransport } from "nodemailer";
import express, { Request, Response } from "express";
import { models } from "../models/rdbms";
import logger from "../utils/logger";

const server = {
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    from: process.env.EMAIL_FROM,
};
const VerificationRouter = express.Router();

VerificationRouter.post("/callback/identity-verify", async (req, res, next) => {
    const { token, verifyEmail, phoneNumber, profileId, type } = req.body;

    const user = res.session?.user ?? null;

    if (
        (type !== undefined && !["student", "corp", "orgn"].includes(type)) ||
        verifyEmail === undefined ||
        phoneNumber === undefined ||
        token === undefined ||
        (profileId === undefined && ["corp", "orgn"].includes(type))
    ) {
        res.json("Wrong request");
    }

    if (user === null) {
        res.json("Login first");
    }

    const userInstance =
        (
            await models.User.findOne({
                where: { email: user.email },
            })
        )?.get({ plain: true }) ?? null;

    if (userInstance === null || userInstance?.email_verified === null) {
        res.json("Verify first");
        return;
    }

    const verificationToken = await models.VerificationToken.findOne({
        where: { identifier: verifyEmail },
        order: [["expires", "DESC"]],
    });

    if (
        verificationToken === null ||
        verificationToken.dataValues.token !== token
    ) {
        res.json("Wrong identification");
        return;
    }

    if (type === "student") {
        await models.Student.update(
            { email_verified: new Date() },
            { where: { student_id: profileId } },
        );
    } else if (type === "corp") {
        await models.Consumer.create({
            user_id: userInstance.user_id,
            consumer_email: verifyEmail,
            consumer_verified: new Date(),
            corp_id: profileId,
            consumer_type: "corp",
            phone_number: "",
        });
    } else if (type === "orgn") {
        await models.Consumer.create({
            user_id: userInstance.user_id,
            consumer_email: verifyEmail,
            consumer_verified: new Date(),
            orgn_id: profileId,
            consumer_type: "orgn",
            phone_number: "",
        });
    }
    logger.debug(`User email Verified through email: ${userInstance}`);
    if (userInstance.roles === null) {
        userInstance.roles = [type];
    } else {
        userInstance.roles = Array.from(new Set([userInstance.roles, type]));

    }

    await models.User.update(userInstance, { where: { email: user.email } });

    res.json({ response: "ok" });
});

VerificationRouter.post("/identity-verify", async (req, res, next) => {
    const { verifyEmail, type } = req.body;
    const user = res.session?.user ?? null;

    if (user === null) {
        res.json("Login first");
    }

    const userInstance =
        (
            await models.User.findOne({
                where: { email: user.email },
            })
        )?.get({ plain: true }) ?? null;

    if (userInstance === null || userInstance?.email_verified === null) {
        res.json("Verify first");
        return;
    }

    // random string
    // TODO: 숫자 영어 조합 6개
    const randomStr = crypto.randomUUID().split("-").at(0) as string;

    await models.VerificationToken.destroy({
        where: { identifier: user.email },
    });

    const createdToken = await models.VerificationToken.create({
        identifier: verifyEmail,
        token: token,
        expires: new Date(Date.now() + 3600 * 1000),
        token_type: type,
    });

    const url = `http://localhost:8080/api/verification/callback/identity-verify?token=${randomStr}&email=${user.email}&verifyEmail=${verifyEmail}&type=${type}`;
    const { host } = new URL(url);
    const token = randomStr;
    // NOTE: You are not required to use `nodemailer`, use whatever you want.
    const transport = createTransport(server);
    const theme = null;
    const result = await transport.sendMail({
        to: verifyEmail,
        from: server.from,
        subject: `Sign in to ${host}`,
        text: text({ url, host }),
        html: html({ url, host, theme, token }),
    });
    const failed = result.rejected.concat(result.pending).filter(Boolean);
    if (failed.length) {
        throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
    }
    res.json("");
});

function html(params: {
    url: string;
    host: string;
    theme: Theme;
    token: string;
}) {
    const { url, host, theme, token } = params;

    const escapedHost = host.replace(/\./g, "&#8203;.");

    const brandColor = theme?.brandColor ?? "#346df1";
    const color = {
        background: "#f9f9f9",
        text: "#444",
        mainBackground: "#fff",
        buttonBackground: brandColor,
        buttonBorder: brandColor,
        buttonText: theme?.buttonText ?? "#fff",
    };

    return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Sign in to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center"
                style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
                Input <strong>${token}</strong>
            </td>            
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;
}

// Email Text body (fallback for email clients that don't render HTML, e.g. feature phones)
function text({ url, host }: { url: string; host: string }) {
    return `Sign in to ${host}\n${url}\n\n`;
}

export default VerificationRouter;
