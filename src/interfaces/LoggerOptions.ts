import { LogLevels } from "../types/LogLevels";
import { RedactionOptions } from "./RedactionOptions";

export interface LoggerOptions {
    /**
     * The logger name, will add a name property to every object logged
     * Default: undefined
     */
    name: string | undefined;

    /**
     * The lowest log level to log, anything lower will not be logged
     * Default: "info"
     */
    logLevel: LogLevels;
    
    /**
     * As an array, the redact option specifies paths that should have their values redacted from any log output.
     * Each path must be a string using a syntax that corresponds to JavaScript dot and bracket notation.
     * When an object is provided @see {RedactionOptions}
     */
    redact: string[] | RedactionOptions | undefined;
    
    /**
     * Key-value object added as child logger to each log line.
     * Default: {pid: process.pid, hostname: os.hostname}
     */
    base: { [index: string]: any } | undefined;

    /**
     * Enables or disables the inclusion of a timestamp in the log message.
     * Default: true
     */
    timestamp: boolean;

    /**
     * The string key for the 'message' in the JSON object.
     * Default: "msg"
     */
    messageKey: string;

    /**
     * The string key for the 'error' in the JSON object.
     * Default: "err"
     */
    errorKey: string;
}