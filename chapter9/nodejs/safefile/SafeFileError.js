/**
 * Error for safeFile errors/exceptions
 */

/**
 * Create SafeFileError instance with code and message.
 * @param {integer} code Message identifier.
 * @param [string] message Message text.
 */
function SafeFileError (code, message) {
    this.name = "SafeFileError";
    this.code = code;
    this.message = message;
}

// constants
var p = SafeFileError.prototype;
p.NO_ERROR = 0;
p.INVALID_NAME = 100;
p.DOES_NOT_EXIST = 101;
p.IS_NOT_A_FILE = 102;
p.READ_ERROR = 103;
p.WRITE_ERROR = 104;
p.SAFE_NORMAL = 0;
p.SAFE_RECOVERABLE = 110;
p.SAFE_INTERVENE = 111;

p.MSG_INVALID_NAME = "File name missing or not valid";
p.MSG_IS_NOT_A_FILE = "File {0} is not a file";
p.MSG_DOES_NOT_EXIST = "File {0} does not exist";
p.MSG_READ_ERROR = "Error reading file {0}: {1}";
p.MSG_WRITE_ERROR = "Error writing file {0}: {1}";

//exports
exports.SafeFileError = SafeFileError;
