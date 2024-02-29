import { Logger } from "../../classes/Logger";
import { PartialConsoleOutputOptions } from "./PartialConsoleOutputOptions";
import { PartialFileOutputOptions } from "./PartialFileOutputOptions";

export interface PartialOutputOptions {
    /**
     * The function to format the log output.
     *  When providing a string you must specify one of the predefined formats:
     *   - 'raw' logs the raw data
     *   - 'standard' logs in a standard format
     *   - 'standard-full-date' logs in the standard format including the full date in the timestamp
     * 
     * Default: 'standard'
     */
    formatting?: string | ((this: Logger, data: { [index: string]: any }) => string)

    /**
     * Controls if the time used in logs is zulu time or local time
     * Default: true
     */
    useZuluTime?: boolean

    /**
     * The options for the outputing to the console
     */
    console?: PartialConsoleOutputOptions

    /**
     * The options for the outputing to a file
     */
    file?: PartialFileOutputOptions
}