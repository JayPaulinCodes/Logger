import { LoggerError } from "../errors/LoggerError";

export class DirectoryCreationError extends LoggerError {

    constructor(path: string, exception?: NodeJS.ErrnoException) {
        let message: string;
        let cause: string | NodeJS.ErrnoException | undefined

        switch (exception?.code) {
            case "EACCES":
                message = `Failed to create '${path}' due to improper access.`;
                cause = `The parent directory does not allow write permission to the process, or one of the directories in '${path}' did not allow search permission.`;
                break;

            case "EDQUOT":
                message = `Failed to create '${path}' due to lack of storage.`;
                cause = "The user's quota of disk blocks or inodes on the filesystem has been exhausted.";
                break;

            case "EEXIST":
                message = `Failed to create '${path}' because a directory / file with the same name already exists.`;
                cause = `'${path}' already exists (not necessarily as a directory). This includes the case where '${path}' is a symbolic link, dangling or not.`;
                break;

            case "ENAMETOOLONG":
                message = `Failed to create '${path}' because the path was too long.`;
                cause = `'${path}' was too long.`;
                break;

            case "ENOENT":
                message = `Failed to create '${path}' a directory component in the path does not exist.`;
                cause = `A directory component in '${path}' does not exist or is a dangling symbolic link.`;
                break;

            default: 
                message = `An unknown error occured while trying to create the directory '${path}'`;
                cause = exception;
                break;
        }
     
        super({ message, cause });
    }
}