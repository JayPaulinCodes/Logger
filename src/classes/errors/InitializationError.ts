import { format } from "util";
import { LoggerError } from "./LoggerError";

export abstract class InitializationError extends LoggerError {
    constructor(code: string, message: string) {
        super(code, format("An error occured during initialization: %s", message));
    }
}