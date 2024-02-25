import { ILoggerError } from "./ILoggerError";
import { LoggerError } from "./LoggerError";

export class InitializationError extends LoggerError {
    constructor(options?: ILoggerError | undefined) {
        super({
            message: "An unknown initalization error occured.",
            ...options
        });
    }
}