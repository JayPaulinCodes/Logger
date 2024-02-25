import { ILoggerError } from "../errors/ILoggerError";

export abstract class LoggerError extends Error implements LoggerError {
	constructor(options: ILoggerError) {
		super(options.message, (options.cause === undefined ? undefined : { cause: options.cause }));
	}
}