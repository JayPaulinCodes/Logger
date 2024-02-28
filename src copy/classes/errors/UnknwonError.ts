import { LoggerError } from "./LoggerError";

export class UnknwonError extends LoggerError {
    constructor() {
        super("LOG_ERR_UNKNWON", "An unknwon error occured");
    }
}