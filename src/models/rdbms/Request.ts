import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";
import type { Consumer, ConsumerId } from "./Consumer";

export interface RequestAttributes {
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
    request_status?: number;
    start_time?: string;
    end_time?: string;
    created_at?: Date;
    updated_at?: Date;
    corp_id?: number;
    orgn_id?: number;
}

export type RequestPk = "request_id";
export type RequestId = Request[RequestPk];
export type RequestOptionalAttributes =
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
    | "request_status"
    | "start_time"
    | "end_time"
    | "created_at"
    | "updated_at"
    | "corp_id"
    | "orgn_id";
export type RequestCreationAttributes = Optional<
    RequestAttributes,
    RequestOptionalAttributes
>;

export class Request
    extends Model<RequestAttributes, RequestCreationAttributes>
    implements RequestAttributes
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
    start_date?: string;
    end_date?: string;
    address?: string;
    address_coordinate?: any;
    provide_food?: any;
    provide_trans_exp?: any;
    prep_material?: object;
    request_status?: number;
    start_time?: string;
    end_time?: string;
    created_at?: Date;
    updated_at?: Date;
    corp_id?: number;
    orgn_id?: number;

    // Request belongsTo Consumer via consumer_id
    consumer!: Consumer;
    getConsumer!: Sequelize.BelongsToGetAssociationMixin<Consumer>;
    setConsumer!: Sequelize.BelongsToSetAssociationMixin<Consumer, ConsumerId>;
    createConsumer!: Sequelize.BelongsToCreateAssociationMixin<Consumer>;

    static initModel(sequelize: Sequelize.Sequelize): typeof Request {
        return Request.init(
            {
                request_id: {
                    autoIncrement: true,
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                },
                consumer_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: "Consumer",
                        key: "consumer_id",
                    },
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
                        "There could be various statuses of a request.\n\nFor example\n\nPosted: consumer wrote a request but not paid\nPaid: consumer paid for a request\nOutdated: No provider(s) contracted with a consumer\nContracted: provider(s) contracted with a consumer\nFinished: work has been done!\nFailed: Contraction didn’t work properly\n",
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
                    allowNull: true,
                    comment:
                        "Have no idea that this field could be utilized late;;",
                },
                orgn_id: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    comment:
                        "Have no idea that this field could be utilized late;;",
                },
            },
            {
                sequelize,
                tableName: "Request",
                timestamps: false,
                indexes: [
                    {
                        name: "PRIMARY",
                        unique: true,
                        using: "BTREE",
                        fields: [{ name: "request_id" }],
                    },
                    {
                        name: "consumer_id_idx",
                        using: "BTREE",
                        fields: [{ name: "consumer_id" }],
                    },
                ],
            },
        );
    }
}
