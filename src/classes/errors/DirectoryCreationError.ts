import { InitializationError } from "./InitializationError";

export class DirectoryCreationError extends InitializationError {
    constructor(path: string, exception?: NodeJS.ErrnoException) {
        let message: string;

        switch (exception?.code) {
            case "EACCES":
                message = `Failed to create '${path}' due to improper access.`;
                break;

            case "EDQUOT":
                message = `Failed to create '${path}' due to lack of storage.`;
                break;

            case "EEXIST":
                message = `Failed to create '${path}' because a directory / file with the same name already exists.`;
                break;

            case "ENAMETOOLONG":
                message = `Failed to create '${path}' because the path was too long.`;
                break;

            case "ENOENT":
                message = `Failed to create '${path}' a directory component in the path does not exist.`;
                break;

            default: 
                message = `An unknown error occured while trying to create the directory '${path}'`;
                break;
        }

        super(`LOG_ERR_DIR_CREATE${(exception?.code !== undefined ? `_${exception.code}` : "")}`, message);
    }
}