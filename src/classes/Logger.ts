import { WriteStream, createWriteStream, mkdir, stat } from "fs";
import { readdir, unlink } from "fs/promises";
import { LoggerOptions } from "../interfaces/LoggerOptions";
import { DirectoryCreationError } from "./errors/DirectoryCreationError";
import { NotInitializedError } from "./errors/NotInitializedError";
import dateFormat from "./DateFormat";

export class Logger {
    private options: LoggerOptions;
    private writeStream: WriteStream | null = null;
    private fileSwitchTimeout?: NodeJS.Timeout;
    private initComplete: boolean = false;
    private initResolve?: (value: void | PromiseLike<void>) => void;
    private initReject?: (reason?: any) => void;

    constructor(options?: Partial<LoggerOptions>) {
        this.options = {
            logsDirectory: "./logs/",
            useZuluTime: false,
            logFileNameFormat: "yyyy-mm-dd'T'hh-MM-ss",
            logPrefixFormat: "[yyyy-mm-dd hh:MM:ss.l Z] ",
            onlyLogToFile: false,
            ...options
        }
        this.init().catch(err => {
            console.log(err as Error)
        });
    }

    public get logDirectory(): string {
        return this.options.logsDirectory;
    }

    public get currentLogFilePath(): string | Buffer | undefined {
        return this.writeStream?.path;
    }

    public async awaitInit(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.initComplete) {
                resolve();
                return;
            }

            this.initResolve = resolve;
            this.initReject = reject;
        });
    }

    private async init(): Promise<void> {
        if (this.initComplete) return;

        try {
            await this.setUpLogFileAsync();
            this.scheduleLogFileSwitch();

            if (this.initResolve !== undefined) this.initResolve();
            
            this.initComplete = true;
            this.initResolve = undefined;
            this.initReject = undefined;
        } catch (err) {
            console.log(err as Error);
            if (this.initReject !== undefined) this.initReject(err);
        }
    }

    private fileNameFromDate(date: Date = new Date()): string {
        return dateFormat(date, this.options.logFileNameFormat+"'.log'", this.options.useZuluTime);
    }

    private logPrefixFromDate(date: Date = new Date()): string {
        return dateFormat(date, this.options.logPrefixFormat, this.options.useZuluTime);
    }

    private formatMessage(message: string): string {
        return this.logPrefixFromDate()+message;
    }

    private createDirIfNeededAsync(path: string) {
        return new Promise<void>((resolve, reject) => {
            stat(path, (_, stats) => {
                if (stats === undefined) {
                    mkdir(path, { recursive: true }, errMkdir => {
                        if (errMkdir) {
                            reject(new DirectoryCreationError(path, errMkdir));
                            return;
                        }

                        resolve();
                        return;
                    });
                }
                
                resolve();
            });
        });
    }

    private setUpLogFileAsync(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this.createDirIfNeededAsync(this.options.logsDirectory);
                const fileName = this.fileNameFromDate();
                const filePath = this.options.logsDirectory + fileName;
                const oldWriteStream = this.writeStream;
                const newWriteStream = createWriteStream(filePath, { flags: "wx", encoding: "utf8" });

                newWriteStream.on("open", async () => {
                    try {
                        this.writeStream = newWriteStream;
                        this.writeStream.write(`--- Log file created at ${dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss.l Z")} ---\n`);

                        if (oldWriteStream !== null) {
                            oldWriteStream.write(`--- Log file closed as of ${dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss.l Z")} ---`);
                            await this.closeWriteStreamAsync(oldWriteStream);
                        }

                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });

                newWriteStream.on("error", err => {
                    reject(err);
                });
            } catch (err) {
                if (err instanceof DirectoryCreationError) {
                    reject(err);
                    return;
                }
                reject(err);
            }
        });
    }

    private closeWriteStreamAsync(stream: WriteStream): Promise<void> {
        return new Promise<void>(resolve => stream.end(resolve));
    }

    private async purgeOldFiles(oldestFileAgeMs: number = 2592000000): Promise<void> {
        await Promise.all((await readdir(this.options.logsDirectory)).map(async file => {
            const fileDateTime = file.slice(0, file.length - 4);
            const fileAgeMs = new Date(fileDateTime.replace(/([0-9]{2})-([0-9]{2})-([0-9]{2})$/, "$1:$2:$3")).getTime();
        
            if (fileAgeMs + oldestFileAgeMs <= Date.now()) {
                try {
                    const filePath = this.options.logsDirectory + file;
                    await unlink(filePath);
                } catch (err) {
                    console.log(err as Error);
                }
            }
        }));
    }

    private scheduleLogFileSwitch(): void {
        // Previously was: 86400000 - (((Date.now() + 5000) % 86400000) - 5000)
        const MS_24_HRS = 24 * 60 * 60 * 1000; // 86400000
        const MS_DELAY = MS_24_HRS - (Date.now() % MS_24_HRS);
        this.fileSwitchTimeout = setTimeout(() => {
            try {
                this.setUpLogFileAsync();
            } catch (err) {
                if (err instanceof Error) console.log(`Failed to create new log file:\n${err.stack}`);
            }
            
            this.scheduleLogFileSwitch();
            this.purgeOldFiles();
        }, MS_DELAY);
    }

    private print(message: string) {
        if (!this.initComplete) throw new NotInitializedError();

        message = this.formatMessage(message);

        if (!this.options.onlyLogToFile) console.log(message);
        if (this.writeStream !== null) this.writeStream.write(message + "\n");
    }

    public debug(message: string): void {
        this.print(`DEBUG: ${message}`);
    }

    public log(message: string): void {
        this.print(`LOG: ${message}`);
    }

    public warn(message: string): void {
        this.print(`WARN: ${message}`);
    }

    public error(message: string): void {
        this.print(`ERROR: ${message}`);
    }
}