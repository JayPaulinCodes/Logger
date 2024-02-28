import { InitializationError } from "./InitializationError";

export class NotInitializedError extends InitializationError {
    constructor() {
        super("LOG_ERR_NOT_INIT", "The logger cannot be accessed prior to initalization.");
    }
}