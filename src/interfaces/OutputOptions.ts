export interface OutputOptions {
    /**
     * The function to format the log output, when set to undefined it will print the raw
     * JSON object. When providing a string you must specify one of the predefined formats:
     *   - 'raw' logs data as raw json object
     *   - 'standard' logs in a standard format
     */
    formatting: string | Function | undefined
}