export interface PartialFileOutputOptions {
    /**
     * Controls if the output is printed to the a log file
     * Default: false
     */
    enabled?: boolean

    /**
     * The directory to create the log files in
     * Default: './logs/'
     */
    outputDirectory?: string

    /**
     * The format for the name of the log files
     * Supports DateFormat variables
     * Default: 'yyyy-mm-dd'T'hh-MM-ss.log'
     */
    outputFileName?: string

    /**
     * Controls if files should be deleted after a specific age.
     * Use a number to define the max age in ms, with -1 being infinite.
     * 2592000000 = 30 days
     * Default: null
     */
    maxFileAge?: number;
}