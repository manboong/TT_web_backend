"use strict";
import { Response, NextFunction } from "express";

function asSuccess(data: any) {
    return new SuccessResult(data);
}

function asError(error: any) {
    return new ErrorResult(error);
}

type Parameter = any[];
type RunOptions = { log: boolean };

type Function<F extends (...args: any) => any> = (
    ...params: Parameter
) => ReturnType<F>;

type AsyncFunction<F extends (...args: any) => any> = (
    ...params: Parameter
) => Promise<ReturnType<F>>;

type MiddlewareFunction = (
    req: Request,
    res: Response,
    next: NextFunction,
) => any;
type AsyncMiddlewareFunction = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<any>;

class Result<T> {
    __data: T;
    __error: any;

    constructor(data: T, error: any) {
        this.__data = data;
        this.__error = error;
    }

    isFailure(): boolean {
        return this instanceof ErrorResult;
    }

    isSuccessful(): boolean {
        return this instanceof SuccessResult;
    }

    onFailure(f?: Function<any>) {
        if (f === undefined || this.isFailure() === false) {
            // Do nothing
            return this;
        } else {
            f(this.__error);
            return this;
        }
    }

    onSuccess(f?: Function<any>) {
        if (f === undefined || this.isSuccessful() === false) {
            // Do nothing
            return this;
        } else {
            f(this.__data);
            return this;
        }
    }

    also(f?: Function<any>) {
        if (f === undefined) {
            return this;
        } else {
            f();
            return this;
        }
    }

    getOrThrow(): T | never {
        if (this.isFailure()) {
            this.onFailure().also();
            throw this.__error;
        } else {
            this.onSuccess().also();
            return (this as SuccessResult<T>).__data;
        }
    }

    getOrNull(): T | null {
        if (this.isFailure()) {
            this.onFailure().also();
            return null;
        } else {
            this.onSuccess().also();
            return (this as SuccessResult<T>).__data;
        }
    }

    getOrDefault<V extends any>(defaultValue: V): T | V {
        if (this.isFailure()) {
            this.onFailure().also();
            return defaultValue;
        } else {
            this.onSuccess().also();
            return (this as SuccessResult<T>).__data;
        }
    }

    getOrElse<F extends Function<any>>(f: F): T | ReturnType<F> {
        if (this.isFailure()) {
            this.onFailure().also();
            return f(this.__error);
        } else {
            this.onSuccess().also();
            return (this as SuccessResult<T>).__data;
        }
    }

    exceptionOrNull(): Error | any | null {
        if (this.isFailure()) {
            this.onFailure().also();
            return this.__error;
        } else {
            this.onSuccess().also();
            return null;
        }
    }
}

class SuccessResult<T> extends Result<T> {
    constructor(data: T) {
        super(data, null);
    }
}

class ErrorResult extends Result<any> {
    constructor(error: any) {
        super(null, error);
    }
}

export function runCatching<F extends Function<any>>(
    execute: F,
    options: RunOptions = { log: false },
): Result<ReturnType<F>> {
    try {
        const result = execute();
        return asSuccess(result);
    } catch (error) {
        if (options.log) console.error(error);
        return asError(error);
    }
}

export async function runCatchingAsync<AF extends AsyncFunction<any>>(
    execute: AF,
    options: RunOptions = { log: false },
): Promise<Result<Awaited<ReturnType<AF>>>> {
    try {
        const result = await execute();
        return asSuccess(result);
    } catch (error) {
        if (options.log) console.error(error);
        return asError(error);
    }
}
export function runCatchingExpress<F extends Function<any>>(
    execute: F,
    options: RunOptions = { log: false },
): MiddlewareFunction {
    return (req: any, res: Response, next: NextFunction) => {
        return runCatching(execute, options);
    };
}

export function runCatchingExpressAsync<AF extends AsyncFunction<any>>(
    execute: AF,
    options: RunOptions = { log: false },
): AsyncMiddlewareFunction {
    return async (req: any, res: Response, next: NextFunction) => {
        return await runCatchingAsync(execute, options);
    };
}
