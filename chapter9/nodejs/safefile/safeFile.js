/**
 * File processing functions for managed files.
 * 
 * readFileSync - Read a file
 * writeFileSync - Write a file
 * safeGetState - Get the recovery state for a file
 * safeRecover - Initiate recovery for a file
 * safeReadFileSync - Read with recovery support 
 * safeWriteFileSync - Write with recovery support
 */
// import format function and Node.js file system module
var format = require ("ujs-format").format;
var fs = require ("fs");
var SafeFileError = require ("./SafeFileError").SafeFileError;
var cc = SafeFileError.prototype;

/**
 * Read file.
 * @param {String} fileName File to read.
 * @returns {String} Data read from file.
 * @throws SafeFileError
 */
function readFileSync (fileName, options) {
    verifyFileName (fileName);

    var info = getFileInfo (fileName);
    if (info.exists === false) {
        var message1 = format (cc.MSG_DOES_NOT_EXIST, fileName);
        throw new SafeFileError (cc.DOES_NOT_EXIST, message1);
    }
    if (info.isFile === false) {
        var message2 = format (cc.MSG_IS_NOT_A_FILE, fileName);
        throw new SafeFileError (cc.IS_NOT_A_FILE, message2);
    }

    // read data file
    var data = null;
    try {
        data = fs.readFileSync (fileName, options);
    } catch (e) {
        var message3 = format (cc.MSG_READ_ERROR, fileName, e.message);
        throw new SafeFileError (cc.READ_ERROR, message3);
    }

    // return data
    return (data);
}

/**
 * Write data to a file.
 * @param {String} fileName Name of file (path optional).
 * @param {String} data Data to write.
 * @throws SafeFileError
 */
function writeFileSync (fileName, data, options) {
    verifyFileName (fileName);
    
    var info = getFileInfo (fileName);
    if ((info.exists === true) && (info.isFile === false)) {
        var message1 = format (cc.MSG_IS_NOT_A_FILE, fileName);
        throw new SafeFileError (cc.IS_NOT_A_FILE, message1);
    }

    // if content undefined or null, set data to empty string
    if ((data === undefined) || (data === null)) {
        data = "";
    }

    // write file content, throwing exception on error occurring
    try {
        fs.writeFileSync (fileName, data, options);
    } catch (e) {
        var message2 = format (cc.MSG_WRITE_ERROR, e.message);
        throw new SafeFileError (cc.WRITE_ERROR, message2);
    }
}

/**
 * Get status of the file.
 * @param {String} file Name of base file.
 * @returns {Integer} SAFE_NORMAL, SAFE_AUTO_RECOVERABLE, SAFE_INTERVENE,
 *     INVALID_NAME, IS_NOT_A_FILE, or DOES_NOT_EXIST
 */
function safeGetState (fileName) {
    if ((fileName === undefined) || (fileName === null)) {
        return (cc.INVALID_NAME);
    }
    // if fileName exists, verify it is a file
    var info = getFileInfo (fileName);
    if ((info.exists) && (info.isFile === false)) {
        return (cc.IS_NOT_A_FILE);
    }

    var state = getState (fileName);
    return (state.status);
}

/**
 * Initiate auto-recovery processing.
 * @param {String} fileName Name of base file
 * @throws SafeFileError
 */
function safeRecover (fileName) {
    verifyFileName (fileName);

    // if fileName exists, verify it is a file
    var info = getFileInfo (fileName);
    if ((info.exists) && (info.isFile === false)) {
        var message1 = format (cc.MSG_IS_NOT_A_FILE, fileName);
        throw new SafeFileError (cc.IS_NOT_A_FILE, message1);
    }

    // get state, if doesn't exist throw error
    var state = getState (fileName);
    if (state.status === cc.DOES_NOT_EXIST) {
        var message2 = format (cc.MSG_DOES_NOT_EXIST, fileName);
        throw new SafeFileError (cc.DOES_NOT_EXIST, message2);
    }
        
    performRecovery (state, true);
}

/**
 * Read a file, performing recovery processing if necessary.
 * @param {String} file File to read.
 * @returns {String} Data read from file.
 * @throws SafeFileError
 */
function safeReadFileSync (fileName, options) {
    verifyFileName (fileName);
    
    // if fileName exists, verify it is a file
    var info = getFileInfo (fileName);
    if ((info.exists) && (info.isFile === false)) {
        var message = format (cc.MSG_IS_NOT_A_FILE, fileName);
        throw new SafeFileError (cc.IS_NOT_A_FILE, message);
    }

    // get state, if auto-recovery required, perform recovery
    var state = getState (fileName);
    if (state.status === cc.SAFE_RECOVERABLE) {
        performRecovery (state, true);
    }

    // perform read on file
    return (readFileSync (fileName, options));
}

/**
 * Write data to a file using a recoverable process.
 * @param {String} fileName Name of file (path optional).
 * @param {String} data Data to write.
 * @throws SafeFileError
 */
function safeWriteFileSync (fileName, data, options) {
    verifyFileName (fileName);
    
    // if fileName exists, verify it is a file
    var info = getFileInfo (fileName);
    if ((info.exists) && (info.isFile === false)) {
        var message = format (cc.MSG_IS_NOT_A_FILE, fileName);
        throw new SafeFileError (cc.IS_NOT_A_FILE, message);
    }

    // get current file system state, and auto-recover if necessary
    var state = getState (fileName);

    // store data in well defined ephemeral file to allow manual recovery
    // If file already exists, remove it (failed prior recovery).
    if (state.ephemeral.exists) {
        fs.unlinkSync (state.ephemeral.name);
    }

    writeFileSync (state.ephemeral.name, data, options);
    state.ephemeral.exists = true;

    // if ready state file already exists, recover prior state
    if (state.ready.exists) {
        performRecovery (state, false);
    }
    
    fs.renameSync (state.ephemeral.name, state.ready.name);

    // refresh state and process recovery to set file system state
    state = getState (fileName);
    performRecovery (state, true);
}

/**
 * Verify fileName parameter.
 * @param {String} fileName Name of file to verify.
 * @throws SafeFileError
 */
function verifyFileName (fileName)
{
    // if fileName undefined or null, throw exception
    if ((fileName === undefined) || (fileName === null)) {
        var message1 = format (cc.MSG_INVALID_NAME);
        throw new SafeFileError (cc.INVALID_NAME, message1);
    }
}

/**
 * Get state for file system entities.
 * @param {String} file Base file name.
 * @returns {Object} State object.
 */
function getState (file) {
    // collect state for all possible data and recovery files
    var state = {};
    state.ephemeral = getFileInfo (file + ".eph");
    state.ready = getFileInfo (file + ".rdy");
    state.base = getFileInfo (file);
    state.backup = getFileInfo (file + ".bak");
    state.tertiary = getFileInfo (file + ".bk2");

    if (state.ephemeral.exists) {
        state.status = cc.SAFE_INTERVENE;
    } else if ((state.ready.exists) || (state.tertiary.exists)) {
        state.status = cc.SAFE_RECOVERABLE;
    } else if (state.base.exists) {
        state.status = cc.SAFE_NORMAL;
    } else {
        if (state.backup.exists) {
            state.status = cc.SAFE_RECOVERABLE;
        } else {
            state.status = cc.DOES_NOT_EXIST;
        }
    }

    return (state);
}

/**
 * Get existence, file/directory info for a file.
 * @param {String} fileName Name of file to get info for
 * @returns {Object}
 */
function getFileInfo (fileName) {
    var result = {};
    result.name = fileName;
    result.exists = fs.existsSync (fileName);
    if (result.exists) {
        var stats = fs.statSync (fileName);
        result.isFile = stats.isFile ();
        result.isDirectory = stats.isDirectory ();
    }
    else {
        result.isFile = false;
        result.isDirectory = false;
    }
    
    return (result);
}

/**
 * Evaluate save state, initiating recovery if necessary.
 * @param {Object} state State object with file names and existence flags
 */
function performRecovery (state, removeEphemeral) {
    // if ephemeral flag true, and ephemeral file exists, remove it
    if ((removeEphemeral) && (state.ephemeral.exists)) {
        fs.unlinkSync (state.ephemeral.name);
    }

    // if only backups exist, restore from backup
    var baseAvailable = state.base.exists || state.ready.exists;
    if (baseAvailable === false) {
        if (state.tertiary.exists) {
            if (state.backup.exists) {
                fs.renameSync (state.backup.name, state.base.name);
                fs.renameSync (state.tertiary.name, state.backup.name);
            } else {
                fs.renameSync (state.tertiary.name, state.base.name);
            }
        } else if (state.backup.exists) {
            fs.renameSync (state.backup.name, state.base.name);
        }
        
        return;
    }

    // if tertiary state file exists, remove it
    if (state.tertiary.exists) {
        fs.unlinkSync (state.tertiary.name);
    }

    // if ready state file exists, update ready, base and backup files
    if (state.ready.exists) {
        var removeTertiary = false;
        

        // if base and backup exist, rename to tertiary temporarily
        if ((state.base.exists) && (state.backup.exists)) {
            fs.renameSync (state.backup.name, state.tertiary.name);
            removeTertiary = true;
        }

        // if base exists, rename to backup
        if (state.base.exists) {
            fs.renameSync (state.base.name, state.backup.name);
        }

        // place ready state file in base and delete temporary tertiary file
        fs.renameSync (state.ready.name, state.base.name);

        // if temporary tertiary created, remove it
        if (removeTertiary) {
            fs.unlinkSync (state.tertiary.name);
        }
    }
}

// exports
exports.readFileSync = readFileSync;
exports.writeFileSync = writeFileSync;
exports.safeGetState = safeGetState;
exports.safeRecover = safeRecover;
exports.safeReadFileSync = safeReadFileSync;
exports.safeWriteFileSync = safeWriteFileSync;
