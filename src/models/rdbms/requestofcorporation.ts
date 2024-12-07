import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface requestofcorporationAttributes {
    request_id: number;
    consumer_id: number;
    title: string;
    subtitle?: object;
    head_count?: number;
    reward_price: number;
    currency: string;
    content: string;
    are_needed?: object;
    are_required?: object;
    start_date?: string;
    end_date?: string;
    address?: string;
    address_coordinate?: any;
    provide_food?: any;
    provide_trans_exp?: any;
    prep_material?: object;
    created_at?: Date;
    request_status?: number;
    corp_status?: string;
    start_time?: string;
    end_time?: string;
    corp_id: number;
    corp_name: string;
    corp_domain?: string;
    nationality: string;
    corp_address?: string;
    phone_number?: string;
    logo_image?: string;
    site_url?: string;
}

export type requestofcorporationOptionalAttributes =
    | "request_id"
    | "subtitle"
    | "head_count"
    | "are_needed"
    | "are_required"
    | "start_date"
    | "end_date"
    | "address"
    | "address_coordinate"
    | "provide_food"
    | "provide_trans_exp"
    | "prep_material"
    | "created_at"
    | "request_status"
    | "corp_status"
    | "start_time"
    | "end_time"
    | "corp_id"
    | "corp_domain"
    | "corp_address"
    | "phone_number"
    | "logo_image"
    | "site_url";
export type requestofcorporationCreationAttributes = Optional<
    requestofcorporationAttributes,
    requestofcorporationOptionalAttributes
>;

export class requestofcorporation
    extends Model<
        requestofcorporationAttributes,
        requestofcorporationCreationAttributes
    >
    implements requestofcorporationAttributes
{
    request_id!: number;
    consumer_id!: number;
    title!: string;
    subtitle?: object;
    head_count?: number;
    reward_price!: number;
    currency!: string;
    content!: string;
    are_needed?: object;
    are_required?: object;
    date?: string;
    address?: string;
    address_coordinate?: any;
    provide_food?: any;
    provide_trans_exp?: any;
    prep_material?: object;
    created_at?: Date;
    request_status?: number;
    corp_status?: string;
    start_time?: string;
    end_time?: string;
    corp_id!: number;
    corp_name!: string;
    corp_domain?: string;
    nationality!: string;
    corp_address?: string;
    phone_number?: string;
    logo_image?: string;
    site_url?: string;

    static initModel(
        sequelize: Sequelize.Sequelize,
    ): typeof requestofcorporation {
        return requestofcorporation.init(
            {
                request_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                consumer_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                title: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                subtitle: {
                    type: DataTypes.JSON,
                    allowNull: true,
                },
                head_count: {
                    type: DataTypes.TINYINT.UNSIGNED,
                    allowNull: true,
                },
                reward_price: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                currency: {
                    type: DataTypes.STRING(7),
                    allowNull: false,
                },
                content: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                are_needed: {
                    type: DataTypes.JSON,
                    allowNull: true,
                },
                are_required: {
                    type: DataTypes.JSON,
                    allowNull: true,
                },
                start_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                },
                end_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                },
                address: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                address_coordinate: {
                    type: DataTypes.GEOMETRY,
                    allowNull: true,
                },
                provide_food: {
                    type: DataTypes.BLOB,
                    allowNull: true,
                },
                provide_trans_exp: {
                    type: DataTypes.BLOB,
                    allowNull: true,
                },
                prep_material: {
                    type: DataTypes.JSON,
                    allowNull: true,
                },
                request_status: {
                    type: DataTypes.TINYINT,
                    allowNull: true,
                    comment:
                        "There could be various request_statuses of a request.\n\nFor example\n\nPosted: consumer wrote a request but not paid\nPaid: consumer paid for a request\nOutdated: No provider(s) contracted with a consumer\nContracted: provider(s) contracted with a consumer\nFinished: work has been done!\nFailed: Contraction didn’t work properly\n",
                },
                corp_status: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                start_time: {
                    type: DataTypes.TIME,
                    allowNull: true,
                },
                end_time: {
                    type: DataTypes.TIME,
                    allowNull: true,
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
                corp_domain: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                nationality: {
                    type: DataTypes.STRING(4),
                    allowNull: false,
                },
                corp_address: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                phone_number: {
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
                tableName: "requestofcorporation",
                timestamps: false,
            },
        );
    }
}
