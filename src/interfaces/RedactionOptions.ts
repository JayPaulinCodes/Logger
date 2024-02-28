/**
 * @see https://github.com/davidmarkclements/fast-redact
 */
export interface RedactionOptions {
    /**
     * @see https://github.com/davidmarkclements/fast-redact?tab=readme-ov-file#paths--array
     */
    paths: string[];

    /**
     * @see https://github.com/davidmarkclements/fast-redact?tab=readme-ov-file#remove---boolean---false
     */
    remove: boolean;

    /**
     * @see https://github.com/davidmarkclements/fast-redact?tab=readme-ov-file#censor-any-type--redacted
     */
    censor: any;

    /**
     * @see https://github.com/davidmarkclements/fast-redact?tab=readme-ov-file#serialize-function--boolean--jsonstringify
     */
    serialize: Function | boolean;

    /**
     * @see https://github.com/davidmarkclements/fast-redact?tab=readme-ov-file#strict-boolean---true
     */
    strict: boolean;
}