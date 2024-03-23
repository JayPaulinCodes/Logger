import { hostname } from "node:os";
import { WriteStream, mkdirSync, statSync, createWriteStream, readdirSync, unlinkSync, existsSync } from "node:fs";
import dateFormat from "./DateFormat";
import { OptionsBuilder } from "./OptionsBuilder";
import { DirectoryCreationError } from "./errors/DirectoryCreationError";
import { LogFormatting } from "../enums/LogFormatting";
import { LogLevelValues } from "../enums/LogLevelValues";
import { LoggerOptions } from "../interfaces/LoggerOptions";
import { PartialLoggerOptions } from "../interfaces/partials/PartialLoggerOptions";
import { LogLevels } from "../types/LogLevels";
import { format } from "node:util";
import path from "node:path";

export class Logger {
    private readonly _options: LoggerOptions;
    private readonly outputFormatter: (data: { [index: string]: any }) => string;
    private writeStream: WriteStream | null = null;
    private tempFileBuffer: string[] = [];
    private initComplete: boolean = false;
    private closing: boolean = false;
    private opening: boolean = false;
    private fileSwitchTimeout?: NodeJS.Timeout;

    constructor(options: PartialLoggerOptions = {}) {
        // Build the provided options into a complete set of options
        this._options = OptionsBuilder.build(options);

        // Get the output formatter function from the options
        this.outputFormatter = typeof this.options.output.formatting === "string" 
            ? LogFormatting[this.options.output.formatting].bind(this) : this.options.output.formatting.bind(this);

        // Run out init function
        const [ openSucceeded, msg ] = this.open();
        if (!openSucceeded) throw new Error(`Init Error: ${msg}`);
    }

    public get options(): LoggerOptions {
        return this._options;
    }

    public get stream(): WriteStream | null {
        return this.writeStream;
    }

    public get ready(): boolean {
        return this.initComplete;
    }

    private init(): void {
        // Make sure we haven't already ran the init function
        if (this.initComplete || this.opening) return;
        this.opening = true;

        // Create the log file and schedule it's swap if needed
        if (this.options.output.file.enabled) {
            this.setUpLogFile();
            this.scheduleLogFileSwitch();
        }

        this.initComplete = true;
    }

    private getFileNameFromDate(date: Date = new Date()): string {
        return dateFormat(date, this.options.output.file.outputFileName, this.options.output.useZuluTime);
    }

    private createDirIfNeeded(path: string) {
        // Check if the path exists and is a directory
        // Because statSync will throw an error if the file / dir
        // doesn't exist we expect an error to be thrown before we get 
        // to the return line, so we are sure to catch and and verify that we are 
        // getting the error we need. This is basically a overcomplicated if statement
        try {
            statSync(path);
            return;
        } catch (err) {
            const error = err as NodeJS.ErrnoException;
            if (error.code !== "ENOENT") throw error;
        }

        // Make a directory at the path
        try {
            mkdirSync(path, { recursive: true });
        } catch (err) {
            throw new DirectoryCreationError(path, (err as Error));
        }
    }

    private setUpLogFile() {
        // Setup the new file
        const trueFileDir = path.normalize(this.options.output.file.outputDirectory);
        this.createDirIfNeeded(trueFileDir);
        let fileName: string;
        let filePath: string;
        let iterations = 0;
        do {
            fileName = iterations > 0 ? format("%s (%s).log", this.getFileNameFromDate(), iterations) : format("%s.log", this.getFileNameFromDate());
            filePath = trueFileDir + fileName;
            iterations++;
        } while (existsSync(format("%s\\%s", process.cwd(), filePath)));
        const oldStream = this.writeStream;
        const newStream = createWriteStream(filePath, { flags: "wx", encoding: "utf8" });
        this.writeStream = null;

        // Wait for the new file to open
        newStream.on("open", () => {
            // Write the stream opening line before setting the property to ensure it's always first
            newStream.write(`--- Log file created at ${dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l Z", this.options.output.useZuluTime)} ---\n`);
                    
            // Write the temp storage to the stream
            if (this.tempFileBuffer.length > 0) this.tempFileBuffer.forEach(elem => newStream.write(elem));
            this.tempFileBuffer = [];

            // Assign the stream property
            this.writeStream = newStream;

            // Close out the old file
            if (oldStream !== null) {
                oldStream.write(`--- Log file closed as of ${dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l Z", this.options.output.useZuluTime)} ---`);
                oldStream.end();
            }

            this.opening = false;
        });

        return;
    }

    private purgeOldFiles(oldestFileAgeMs: number = 2592000000): void {
        // We can only purge the files if we are using default file name format
        if (!this.options.output.file.enabled || this.options.output.file.outputFileName !== "yyyy-mm-dd'T'HH-MM-ss'.log'") return;
        
        // Get all the files in the directory
        const files = readdirSync(this.options.output.file.outputDirectory);
        
        // Check each file to see if we need to purge it
        files.forEach(file => {
            const fileStat = statSync(this.options.output.file.outputDirectory + file);
            if (fileStat.birthtimeMs + oldestFileAgeMs <= Date.now()) {
                unlinkSync(this.options.output.file.outputDirectory + file);
            }
        });
    }

    private scheduleLogFileSwitch(): void {
        // Previously was: 86400000 - (((Date.now() + 5000) % 86400000) - 5000)
        const MS_24_HRS = 24 * 60 * 60 * 1000; // 86400000
        const DATE = Date.now() + (new Date().getTimezoneOffset() * (this.options.output.useZuluTime ? 0 : -60000));
        const MS_DELAY = MS_24_HRS - (DATE % MS_24_HRS);
        this.fileSwitchTimeout = setTimeout(() => {
            try {
                this.setUpLogFile();
            } catch (err) {
                if (err instanceof Error) console.log(`Failed to create new log file:\n${err.stack}`);
            }
            
            this.scheduleLogFileSwitch();
            this.purgeOldFiles();
        }, MS_DELAY);
    }
    
    private print(level: LogLevels, message?: string, error?: Error): void {
        // If we are in the process of closing or opening the file & logger don't log
        if (this.closing || this.opening) return;

        // If we have disabled bot console and file logging stop
        if (!this.options.output.console.enabled && this.options.output.file.enabled) return;

        // Make sure we are logging this level
        if (LogLevelValues[level] < LogLevelValues[this.options.logLevel]) return;

        // Build the data object to pass to the formatter
        const data: { [index: string]: any } = {};
        data["level"] = level;
        data["pid"] = process.pid;
        data["hostname"] = hostname();
        if (this.options.timestamp) data["time"] = Date.now();
        if (message !== undefined) data["msg"] = message;
        if (error !== undefined) data["err"] = error;

        // Run the data through the output formatter
        const formattedMessage = this.outputFormatter(data);

        // Write to console
        if (this.options.output.console.enabled) console.log(formattedMessage);

        // Write to file
        if (this.options.output.file.enabled) {
            if (this.stream === null) {
                this.tempFileBuffer?.push(formattedMessage+"\n")
            } else {
                this.stream.write(formattedMessage+"\n");
            }
        } 
    }

    public close(): [boolean, string | null] {
        if (this.opening) return [ false, "Cannot close while opening" ];
        if (this.closing) return [ false, "Cannot close while already closing" ];
        if (!this.initComplete) return [ false, "Cannot close already closed logger" ];

        this.closing = true;
        clearTimeout(this.fileSwitchTimeout);

        const oldStream = this.writeStream;
        const oldBuffer = this.tempFileBuffer;
        this.writeStream = null;
        this.tempFileBuffer = [];

        if (oldStream !== null) {    
            // Write the temp storage to the stream
            if (oldBuffer.length > 0) oldBuffer.forEach(elem => oldStream.write(elem));

            oldStream.write(`--- Log file closed as of ${dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l Z", this.options.output.useZuluTime)} ---`);
            oldStream.end();
        }

        this.initComplete = false;
        this.closing = false;
        
        return [ true, null ];
    }

    public open(): [boolean, string | null] {
        if (this.closing) return [ false, "Cannot open while closing" ];
        if (this.opening) return [ false, "Cannot open while already opening" ];
        
        this.init();
        return [ true, null ];
    }

    public debug(message: string): void {
        this.print("debug", message);
    }

    public log(message: string): void {
        this.print("info", message);
    }

    public warn(message?: string, error?: Error): void {
        this.print("warn", message, error);
    }

    public error(message?: string, error?: Error): void {
        this.print("error", message, error);
    }

    public fatal(message?: string, error?: Error): void {
        this.print("fatal", message, error);
    }
}