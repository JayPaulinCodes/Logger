import { Logger } from "../classes/Logger";
import { ConsoleOutputOptions } from "./ConsoleOutputOptions";
import { FileOutputOptions } from "./FileOutputOptions";

export interface OutputOptions {
    /**
     * The function to format the log output.
     *  When providing a string you must specify one of the predefined formats:
     *   - 'raw' logs the raw data
     *   - 'standard' logs in a standard format
     *   - 'standard-full-date' logs in the standard format including the full date in the timestamp
     * 
     * Default: 'standard'
     */
    formatting: string | ((this: Logger, data: { [index: string]: any }) => string);

    /**
     * Controls if the time used in logs is zulu time or local time
     * Default: true
     */
    useZuluTime: boolean;

    /**
     * The options for the outputing to the console
     */
    console: ConsoleOutputOptions;

    /**
     * The options for the outputing to a file
     */
    file: FileOutputOptions;
}