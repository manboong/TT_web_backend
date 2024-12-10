import winston from "winston";
import WinstonDaily from "winston-daily-rotate-file";
import path from "path";
import * as rTracer from "cls-rtracer";

interface InformationType extends winston.Logform.TransformableInfo {
    // Both `level` and `message` must have properties

    // level: string;
    // message: string;
    errorCode?: string;
    logCode?: string;
    logBy?: string;
    depth?: number[];
    userId?: string;
    traceId?: string;
    glbTraceId?: string;
    fileName?: string;
    functionName?: string;
    lineNumber?: string;
    columnNumber?: string;
}

// See: https://v8.dev/docs/stack-trace-api
interface CallSite {
    getThis(): any;
    getTypeName(): string;
    getFunctionName(): string;
    getMethodName(): string;
    getFileName(): string;
    getLineNumber(): number;
    getColumnNumber(): number;
    getFunction(): Function;
    getEvalOrigin(): string;
    isNative(): boolean;
    isToplevel(): boolean;
    isEval(): boolean;
    isConstructor(): boolean;
}

const DefaultCallSite: CallSite = {
    getThis: () => "",
    getTypeName: () => "",
    getFunctionName: () => "",
    getMethodName: () => "",
    getFileName: () => "",
    getLineNumber: () => -1,
    getColumnNumber: () => -1,
    getFunction: () => () => "",
    getEvalOrigin: () => "",
    isNative: () => false,
    isToplevel: () => false,
    isEval: () => false,
    isConstructor: () => false,
};

const printfFormat = (exclude: string[] = []) => {
    return winston.format.printf((info) => {
        return (
            Object.keys(info)
                .reverse()
                .reduce((acc, key, i) => {
                    if (
                        typeof key === "string" &&
                        !exclude.includes(key) &&
                        !["message", "level"].includes(key)
                    ) {
                        if (i > 0) acc += "\n ";
                        acc += `"${key}": "${info[key]}"`;
                    }

                    return acc;
                }, `${info.level} ${info.message} \n{ `) + "\n}"
        );
    });
};
// A custom format builder.
// Register needed field to `info: InformationType`
const customFormat = winston.format((info: InformationType) => {
    // To get a caller, callee, line number, etc...
    // See: https://v8.dev/docs/stack-trace-api
    const priorPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (err, stack) => {
        return stack;
    };
    // golden number: 21!!
    const errorAt = (new Error().stack?.at(21) ?? DefaultCallSite) as CallSite;
    Error.prepareStackTrace = priorPrepareStackTrace;

    const level = info.level.toUpperCase();
    const traceObj = rTracer.id();
    const traceId = traceObj?.id ?? "";
    const glbTraceId = traceObj?.glbTraceId ?? "";
    const str = traceObj?.userId ?? undefined;
    const userId =
        str === undefined
            ? ""
            : `${str.slice(0, 8)}-${str.slice(8, 12)}-${str.slice(12, 16)}-${str.slice(16, 20)}-${str.slice(20)}`;
    const fileName = errorAt.getFileName();
    const functionName =
        errorAt.getFunctionName() ?? errorAt.getMethodName() ?? "<anonymous>";
    const lineNumber = errorAt.getLineNumber();
    const columnNumber = errorAt.getColumnNumber();

    info = {
        ...info,
        level,
        userId,
        glbTraceId,
        traceId,
        fileName,
        functionName,
    };

    return info;
});

let loggerOption: winston.LoggerOptions;

if (process.env.NODE_ENV === "production") {
    loggerOption = {
        format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD hh:mm:ss.SSS" }),
            customFormat(),
            winston.format.json(),
        ),
        transports: [
            new WinstonDaily({
                level: "info",
                datePattern: "YYYY-MM-DD",
                dirname: path.join(process.cwd(), "logs"),
                filename: `%DATE%.log`,
                maxFiles: 30, // 최대 30일치
                zippedArchive: true,
            }),
        ],
        exceptionHandlers: [
            new WinstonDaily({
                level: "error",
                datePattern: "YYYY-MM-DD",
                dirname: path.join(process.cwd(), "logs"),
                filename: `%DATE%.exception.log`,
                maxFiles: 30,
                zippedArchive: true,
            }),
        ],
        rejectionHandlers: [
            new WinstonDaily({
                level: "error",
                datePattern: "YYYY-MM-DD",
                dirname: path.join(process.cwd(), "logs"),
                filename: `%DATE%.rejection.log`,
                maxFiles: 30,
                zippedArchive: true,
            }),
        ],
    };
} else if (process.env.NODE_ENV === "development" || true) {
    const combinedFormats = winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD hh:mm:ss.SSS",
        }),
        customFormat(),
        winston.format.json(),
        winston.format.colorize(),
        printfFormat(["lineNumber", "columnNumber"]),
    );
    loggerOption = {
        transports: [
            new winston.transports.Console({
                format: combinedFormats,
            }),
        ],
        exceptionHandlers: [
            new winston.transports.Console({
                format: combinedFormats,
            }),
        ],
        rejectionHandlers: [
            new winston.transports.Console({
                format: combinedFormats,
            }),
        ],
    };
}

const logger = winston.createLogger(loggerOption);

export default logger;
