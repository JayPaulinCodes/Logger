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
                ? "%s %s: %s"
                : "%s: %s"
            : this.options.timestamp 
                ? "%s %s: %s\n%s"
                : "%s: %s\n%s";

        const timestamp = this.options.timestamp 
            ? dateFormat(data.time, "'['HH:MM:ss.l Z']'", this.options.output.useZuluTime) 
            : null;

        const formatParams = data.err === undefined 
            ? this.options.timestamp
                ? [ timestamp, level, msg ]
                : [ level, msg ]
            : this.options.timestamp
            ? [ timestamp, level, msg, stack ]
            : [ level, msg, stack ];

        return format(unfilledString, ...formatParams);
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
                ? "%s %s: %s"
                : "%s: %s"
            : this.options.timestamp 
                ? "%s %s: %s\n%s"
                : "%s: %s\n%s";

        const timestamp = this.options.timestamp 
            ? dateFormat(data.time, "'['yyyy-mm-dd HH:MM:ss.l Z']'", this.options.output.useZuluTime) 
            : null;

        const formatParams = data.err === undefined 
            ? this.options.timestamp
                ? [ timestamp, level, msg ]
                : [ level, msg ]
            : this.options.timestamp
            ? [ timestamp, level, msg, stack ]
            : [ level, msg, stack ];

        return format(unfilledString, ...formatParams);
    }
} as const;