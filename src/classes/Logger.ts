import { WriteStream, createWriteStream, mkdir, stat } from "fs";
import { readdir, unlink } from "fs/promises";
import { DirectoryCreationError } from "../errors/DirectoryCreationError";
import { FormattedDate } from "../interfaces/FormattedDate";
import { LoggerOptions } from "../interfaces/LoggerOptions";
import { NotInitializedError } from "../errors/NotInitializedError";

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
            logFileNameFormat: "YY-MM-DDTHH-mm-SS",
            logPrefixFormat: "[YY-MM-DD HH:mm:SS.ss ZZ] ",
            onlyLogToFile: false,
            ...options,
            dateFormatting: {
                year: "YYYY",
                month: "MM",
                day: "DD",
                hours: "HH",
                minutes: "MM",
                seconds: "SS",
                milliseconds: "SSS",
                ...options?.dateFormatting
            }
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

    private static offsetMinutesToString(minutes: number): string {
        // Because the timezone offset function on the Date object
        // will return a negative number if we are ahead of UTC
        // we need to consider what the output really should be,
        // so we always will want to multiply our input by -1
        minutes = minutes * -1;

        if (minutes === 0) return "UTC";
        const isNegative = minutes < 0;
        minutes = isNegative ? minutes * -1 : minutes;
        let offsetHours = 0;

        while (minutes >= 60) {
            minutes -= 60;
            offsetHours++;
        }
        
        return "UTC" 
            + (isNegative ? "-" : "+") 
            + offsetHours.toString().padStart(2, "0")
            + ":"
            + minutes.toString().padStart(2, "0");
    }

    private getFormattedDate(date: Date = new Date()): FormattedDate {
        let year = (this.options.useZuluTime ? date.getUTCFullYear() : date.getFullYear()).toString();
        let month = ((this.options.useZuluTime ? date.getUTCMonth() : date.getMonth()) + 1).toString();
        let day = (this.options.useZuluTime ? date.getUTCDay() : date.getDay()).toString();
        let hours = (this.options.useZuluTime ? date.getUTCHours() : date.getHours()).toString();
        let minutes = (this.options.useZuluTime ? date.getUTCMinutes() : date.getMinutes()).toString();
        let seconds = (this.options.useZuluTime ? date.getUTCSeconds() : date.getSeconds()).toString();
        let milliseconds = (this.options.useZuluTime ? date.getUTCMilliseconds() : date.getMilliseconds()).toString();
        let timezone = Logger.offsetMinutesToString(this.options.useZuluTime ? 0 : date.getTimezoneOffset());

        if (this.options.dateFormatting.year === "YY") year = year.slice(2);
        if (this.options.dateFormatting.month === "MM") month = month.padStart(2, "0");
        if (this.options.dateFormatting.day === "DD") day = day.padStart(2, "0");
        if (this.options.dateFormatting.hours === "HH") hours = hours.padStart(2, "0");
        if (this.options.dateFormatting.minutes === "MM") minutes = minutes.padStart(2, "0");
        if (this.options.dateFormatting.seconds === "SS") seconds = seconds.padStart(2, "0");
        if (this.options.dateFormatting.milliseconds === "SS") milliseconds = milliseconds.slice(0, 2);
        if (this.options.dateFormatting.milliseconds === "S") milliseconds = milliseconds.slice(0, 1);

        return {
            year,
            month,
            day,
            hours,
            minutes,
            seconds,
            milliseconds,
            timezone
        }
    }

    /**
     * YY = year
     * MM = month
     * DD = day
     * HH = hour
     * mm = minute
     * SS = second
     * ss = millisecond
     * ZZ = timezone
     */
    private formattedDateToString(format: string, date: FormattedDate = this.getFormattedDate()): string {
        format = format.replace("YY", date.year);
        format = format.replace("MM", date.month);
        format = format.replace("DD", date.day);
        format = format.replace("HH", date.hours);
        format = format.replace("mm", date.minutes);
        format = format.replace("SS", date.seconds);
        format = format.replace("ss", date.milliseconds);
        format = format.replace("ZZ", date.timezone);

        return format;
    }

    private fileNameFromDate(date: Date = new Date()): string {
        return this.formattedDateToString(this.options.logFileNameFormat+".log", this.getFormattedDate(date));
    }

    private logPrefixFromDate(date: Date = new Date()): string {
        return this.formattedDateToString(this.options.logPrefixFormat, this.getFormattedDate(date));
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
                        this.writeStream.write(`--- Log file created at ${this.formattedDateToString("YY-MM-DD HH:mm:SS ZZ")} ---\n`);

                        if (oldWriteStream !== null) {
                            oldWriteStream.write(`--- Log file closed as of ${this.formattedDateToString("YY-MM-DD HH:mm:SS ZZ")} ---`);
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