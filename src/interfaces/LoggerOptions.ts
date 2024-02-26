export interface LoggerOptions {
    logsDirectory: string;
    logFileNameFormat: string;
    logPrefixFormat: string;
    useZuluTime: boolean;
    onlyLogToFile: boolean;
}