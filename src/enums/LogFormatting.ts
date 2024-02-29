import { format } from "node:util";
import dateFormat from "../classes/DateFormat";
import { Logger } from "../classes/Logger";

export const LogFormatting: { [index: string]: (this: Logger, data: { [index: string]: any }) => string } = {
    raw: function(this: Logger, data: { [index: string]: any }): string {
        return JSON.stringify(data);
    },
    standard: function(this: Logger, data: { [index: string]: any }): string {
        const level = String(data.level).toUpperCase();

        const msg = (data.err !== undefined && data.msg === undefined && ((data.err as Error).stack?.split("\n") ?? []).length > 0)
            ? String((data.err as Error).stack?.split("\n")[0])
            : String(data.msg);

        const stack: string | undefined = data.err !== undefined 
            ? String((data.err as Error).stack?.split("\n").slice(1, (data.err as Error).stack?.split("\n").length).join("\n"))
            : undefined;

        const unfilledString = data.err === undefined 
            ? this.options.timestamp 
                ? "'['HH:MM:ss.l Z'] %s: %s'"
                : "%s: %s"
            : this.options.timestamp 
                ? "'['HH:MM:ss.l Z'] %s: %s\n%s'"
                : "%s: %s\n%s";

        const filledString = data.err === undefined 
            ? format(unfilledString, level, msg)
            : format(unfilledString, level, msg, stack);

        return this.options.timestamp 
            ? dateFormat(data.time, filledString, this.options.output.useZuluTime)
            : filledString;
    },
    ["standard-full-date"]: function(this: Logger, data: { [index: string]: any }): string {
        const level = String(data.level).toUpperCase();

        const msg = (data.err !== undefined && data.msg === undefined && ((data.err as Error).stack?.split("\n") ?? []).length > 0)
            ? String((data.err as Error).stack?.split("\n")[0])
            : String(data.msg);

        const stack: string | undefined = data.err !== undefined 
            ? String((data.err as Error).stack?.split("\n").slice(1, (data.err as Error).stack?.split("\n").length).join("\n"))
            : undefined;

        const unfilledString = data.err === undefined 
            ? this.options.timestamp 
                ? "'['yyyy-mm-dd HH:MM:ss.l Z'] %s: %s'"
                : "%s: %s"
            : this.options.timestamp 
                ? "'['yyyy-mm-dd HH:MM:ss.l Z'] %s: %s\n%s'"
                : "%s: %s\n%s";

        const filledString = data.err === undefined 
            ? format(unfilledString, level, msg)
            : format(unfilledString, level, msg, stack);

        return this.options.timestamp 
            ? dateFormat(data.time, filledString, this.options.output.useZuluTime)
            : filledString;
    }
} as const;