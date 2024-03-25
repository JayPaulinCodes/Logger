import smush from "@devjacob/smush";
import { LogFormatting } from "../enums/LogFormatting";
import { LoggerOptions } from "../interfaces/LoggerOptions";
import { PartialLoggerOptions } from "../interfaces/partials/PartialLoggerOptions";

export class OptionsBuilder {
    public static readonly DEFAULT_OPTIONS: LoggerOptions = {
        name: undefined,
        logLevel: "info",
        timestamp: true,
        output: {
            formatting: LogFormatting["standard"],
            useZuluTime: true,
            console: {
                enabled: true
            },
            file: {
                enabled: false,
                outputDirectory: ".\\logs\\",
                outputFileName: "yyyy-mm-dd'T'HH-MM-ss",
                maxFileAge: -1
            }
        }
    }

    public static build(options: LoggerOptions | PartialLoggerOptions): LoggerOptions {
        return <LoggerOptions>smush(this.DEFAULT_OPTIONS, options);
    }
}