import { InitializationError } from "../errors/InitializationError";
import { LoggerError } from "../errors/LoggerError";

export class NotInitializedError extends InitializationError {
    constructor(options?: Partial<LoggerError> | undefined) {
        super({
            ...options,
            message: "The logger cannot be accessed prior to initalization."
        })
    }
}