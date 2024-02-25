import { DateFormatOptions } from "./DateFormatOptions";

export interface LoggerOptions {
    logsDirectory: string;
    logFileNameFormat: "YY-MM-DDTHH-mm-SS" | "YY-MM-DD-HH-mm-SS";
    logPrefixFormat: string;
    useZuluTime: boolean;
    dateFormatting: DateFormatOptions;
    onlyLogToFile: boolean;
}