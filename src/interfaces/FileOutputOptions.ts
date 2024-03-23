export interface FileOutputOptions {
    /**
     * Controls if the output is printed to the a log file
     * Default: false
     */
    enabled: boolean;

    /**
     * The directory to create the log files in
     * Default: '.\\logs\\'
     */
    outputDirectory: string;

    /**
     * The format for the name of the log files
     * Supports DateFormat variables
     * Default: 'yyyy-mm-dd'T'hh-MM-ss'
     */
    outputFileName: string;
}