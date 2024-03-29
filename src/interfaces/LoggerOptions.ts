import { LogLevels } from "../types/LogLevels";
import { OutputOptions } from "./OutputOptions";

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
     * Enables or disables the inclusion of a timestamp in the log message.
     * Default: true
     */
    timestamp: boolean;

    /**
     * The configuration options for the output of the logs
     */
    output: OutputOptions;
}