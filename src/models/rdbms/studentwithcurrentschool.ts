import * as Sequelize from "sequelize";
import { DataTypes, Model, Optional } from "sequelize";

export interface studentwithcurrentschoolAttributes {
    user_id: any;
    name_glb: object;
    birth_date: string;
    student_phone_number: string;
    emergency_contact: string;
    gender: number;
    image: string;
    has_car: number;
    keyword_list: object;
    id: number;
    student_id: number;
    degree: string;
    start_date: string;
    end_date: string;
    status: string;
    faculty: string;
    school_email?: string;
    is_attending?: number;
    school_id: number;
    school_name: string;
    school_name_glb: object;
    country_code: string;
    address: string;
    coordinate: any;
    hompage_url?: string;
    email_domain?: string;
    phone_number?: string;
}

export type studentwithcurrentschoolPk = "id";
export type studentwithcurrentschoolId = studentwithcurrentschool[studentwithcurrentschoolPk];
export type studentwithcurrentschoolOptionalAttributes =
    | "image"
    | "has_car"
    | "id"
    | "school_email"
    | "is_attending"
    | "hompage_url"
    | "email_domain"
    | "phone_number";
export type studentwithcurrentschoolCreationAttributes = Optional<
    studentwithcurrentschoolAttributes,
    studentwithcurrentschoolOptionalAttributes
>;

export class studentwithcurrentschool
    extends Model<studentwithcurrentschoolAttributes, studentwithcurrentschoolCreationAttributes>
    implements studentwithcurrentschoolAttributes
{
    user_id!: any;
    name_glb!: object;
    birth_date!: string;
    student_phone_number!: string;
    emergency_contact!: string;
    gender!: number;
    image!: string;
    has_car!: number;
    keyword_list!: object;
    id!: number;
    student_id!: number;
    degree!: string;
    start_date!: string;
    end_date!: string;
    status!: string;
    faculty!: string;
    school_email?: string;
    is_attending?: number;
    school_id!: number;
    school_name!: string;
    school_name_glb!: object;
    country_code!: string;
    address!: string;
    coordinate!: any;
    hompage_url?: string;
    email_domain?: string;
    phone_number?: string;

    static initModel(sequelize: Sequelize.Sequelize): typeof studentwithcurrentschool {
        return studentwithcurrentschool.init(
            {
                user_id: {
                    type: DataTypes.BLOB,
                    allowNull: false,
                },
                name_glb: {
                    type: DataTypes.JSON,
                    allowNull: false,
                },
                birth_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: false,
                },
                student_phone_number: {
                    type: DataTypes.STRING(32),
                    allowNull: false,
                },
                emergency_contact: {
                    type: DataTypes.STRING(32),
                    allowNull: false,
                },
                gender: {
                    type: DataTypes.TINYINT,
                    allowNull: false,
                },
                image: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    defaultValue: "",
                },
                has_car: {
                    type: DataTypes.TINYINT,
                    allowNull: false,
                    defaultValue: 0,
                },
                keyword_list: {
                    type: DataTypes.JSON,
                    allowNull: false,
                },
                id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    primaryKey: true,
                },
                student_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                degree: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                start_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: false,
                },
                end_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: false,
                },
                status: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                faculty: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                school_email: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                is_attending: {
                    type: DataTypes.TINYINT,
                    allowNull: true,
                    defaultValue: 0,
                    comment:
                        "Whether a student is attending a school now or not.\n\nIf a Student is connected to multiple AcademicHistory, only one is_attending should be set true.\n\nUser can have multiple AcademicHistory, but s/he must be attending only one school.\n\n",
                },
                school_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                school_name: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                school_name_glb: {
                    type: DataTypes.JSON,
                    allowNull: false,
                },
                country_code: {
                    type: DataTypes.STRING(4),
                    allowNull: false,
                },
                address: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                coordinate: {
                    type: DataTypes.GEOMETRY,
                    allowNull: false,
                    comment: "School can have multiple campus\n",
                },
                hompage_url: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                email_domain: {
                    type: DataTypes.STRING(45),
                    allowNull: true,
                },
                phone_number: {
                    type: DataTypes.STRING(45),
                    allowNull: true,
                },
            },
            {
                sequelize,
                tableName: "studentwithcurrentschool",
                timestamps: false,
            },
        );
    }
}
