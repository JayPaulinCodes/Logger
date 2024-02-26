export abstract class LoggerError extends Error {
    code: string;

    constructor(code: string, message: string) {
        super(message);

        this.code = code.toUpperCase();
        this.name = "LoggerError";

        Error.captureStackTrace(this, LoggerError);
    }

    public override toString(): string {
        return `${this.name} [${this.code}]: ${this.message}`
    }
}