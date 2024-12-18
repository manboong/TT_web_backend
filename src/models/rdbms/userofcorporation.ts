import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface userofcorporationAttributes {
    user_id: any;
    username?: string;
    email: string;
    image?: string;
    user_nationality?: string;
    user_working_country?: string;
    roles?: object;
    corp_id: number;
    corp_name: string;
    corp_nationality: string;
    corp_domain?: string;
    ceo_name?: string;
    corp_address?: string;
    phone_number?: string;
    corp_num: number;
    biz_num?: number;
    biz_started_at?: string;
    corp_status?: number;
    biz_type?: string;
    logo_image?: string;
    site_url?: string;
}

export type userofcorporationOptionalAttributes =
    | "user_id"
    | "username"
    | "image"
    | "user_nationality"
    | "user_working_country"
    | "roles"
    | "corp_id"
    | "corp_domain"
    | "ceo_name"
    | "corp_address"
    | "phone_number"
    | "biz_num"
    | "biz_started_at"
    | "corp_status"
    | "biz_type"
    | "logo_image"
    | "site_url";
export type userofcorporationCreationAttributes = Optional<
    userofcorporationAttributes,
    userofcorporationOptionalAttributes
>;

export class userofcorporation
    extends Model<userofcorporationAttributes, userofcorporationCreationAttributes>
    implements userofcorporationAttributes
{
    user_id!: any;
    username?: string;
    email!: string;
    image?: string;
    user_nationality?: string;
    user_working_country?: string;
    roles?: object;
    corp_id!: number;
    corp_name!: string;
    corp_nationality!: string;
    corp_domain?: string;
    ceo_name?: string;
    corp_address?: string;
    phone_number?: string;
    corp_num!: number;
    biz_num?: number;
    biz_started_at?: string;
    corp_status?: number;
    biz_type?: string;
    logo_image?: string;
    site_url?: string;

    static initModel(sequelize: Sequelize.Sequelize): typeof userofcorporation {
        return userofcorporation.init(
            {
                user_id: {
                    type: DataTypes.BLOB,
                    allowNull: false,
                    defaultValue: Sequelize.Sequelize.literal("uuid_to_bin(uuid())"),
                },
                username: {
                    type: DataTypes.STRING(64),
                    allowNull: true,
                },
                email: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                image: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                user_nationality: {
                    type: DataTypes.STRING(2),
                    allowNull: true,
                },
                user_working_country: {
                    type: DataTypes.STRING(2),
                    allowNull: true,
                },
                roles: {
                    type: DataTypes.JSON,
                    allowNull: true,
                    comment:
                        "To implement RBAC based access control, `roles` are needed.\n\nWe can filter unauthorized requests with role entity without querying database.\n\nOnce verification has been occurred user’s roles must be changed!!!!",
                },
                corp_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                corp_name: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                corp_nationality: {
                    type: DataTypes.STRING(4),
                    allowNull: false,
                },
                corp_domain: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                ceo_name: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                corp_address: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                phone_number: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                corp_num: {
                    type: DataTypes.BIGINT.UNSIGNED,
                    allowNull: false,
                },
                biz_num: {
                    type: DataTypes.BIGINT.UNSIGNED,
                    allowNull: true,
                },
                biz_started_at: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                },
                corp_status: {
                    type: DataTypes.TINYINT,
                    allowNull: true,
                },
                biz_type: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                logo_image: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                site_url: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
            },
            {
                sequelize,
                tableName: "userofcorporation",
                timestamps: false,
            },
        );
    }
}
