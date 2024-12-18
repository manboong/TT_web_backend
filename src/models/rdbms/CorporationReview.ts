import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface CorporationReviewAttributes {
    id: number;
    consumer_id: number;
    student_id: number;
    corp_id: number;
    request_id: number;
    request_url: string;
    review_text: string;
    prep_requirement: string;
    sense_of_achive: number;
    work_atmosphere: number;
    created_at?: Date;
    updated_at?: Date;
}

export type CorporationReviewPk = "id";
export type CorporationReviewId = CorporationReview[CorporationReviewPk];
export type CorporationReviewOptionalAttributes = "id" | "created_at" | "updated_at";
export type CorporationReviewCreationAttributes = Optional<
    CorporationReviewAttributes,
    CorporationReviewOptionalAttributes
>;

export class CorporationReview
    extends Model<CorporationReviewAttributes, CorporationReviewCreationAttributes>
    implements CorporationReviewAttributes
{
    id!: number;
    consumer_id!: number;
    student_id!: number;
    corp_id!: number;
    request_id!: number;
    request_url!: string;
    review_text!: string;
    prep_requirement!: string;
    sense_of_achive!: number;
    work_atmosphere!: number;
    created_at?: Date;
    updated_at?: Date;

    static initModel(sequelize: Sequelize.Sequelize): typeof CorporationReview {
        return CorporationReview.init(
            {
                id: {
                    autoIncrement: true,
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                },
                consumer_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                student_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                corp_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                request_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                request_url: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                review_text: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                prep_requirement: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                sense_of_achive: {
                    type: DataTypes.TINYINT,
                    allowNull: false,
                },
                work_atmosphere: {
                    type: DataTypes.TINYINT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                tableName: "CorporationReview",
                timestamps: true,
                createdAt: "created_at",
                updatedAt: "updated_at",
                indexes: [
                    {
                        name: "PRIMARY",
                        unique: true,
                        using: "BTREE",
                        fields: [{ name: "id" }],
                    },
                ],
            },
        );
    }
}
