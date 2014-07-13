"""
File processing functions for managed files.

readFile - Read a file
writeFile - Write a file
safeGetState - Get the recovery state for a file
safeRecover - Initiate recovery for a file
safeReadFile - Read with recovery support
safeWriteFile - Write with recovery support
"""
from os import unlink, rename
from os.path import exists, isfile, isdir

# error and message constants
NO_ERROR = 0
INVALID_NAME= 100
DOES_NOT_EXIST = 101
IS_NOT_A_FILE = 102
READ_ERROR = 103
WRITE_ERROR = 104
SAFE_NORMAL = 0
SAFE_RECOVERABLE = 110
SAFE_INTERVENE = 111

MSG_INVALID_NAME = "File name missing or not valid"
MSG_IS_NOT_A_FILE = "File {0} is not a file"
MSG_DOES_NOT_EXIST = "File {0} does not exist"
MSG_READ_ERROR = "Error reading file {0}: {1}"
MSG_WRITE_ERROR = "Error writing file {0}: {1}"

class SafeFileError (Exception):
    """
    Error definition thrown when an error occurs.
    Args
        code: Error number
        message: Text message, suitable for display
    """
    def __init__ (self, code, message):
        super (SafeFileError, self).__init__ ()
        self.code = code
        self.message = message

def readFile (file):
    """
    Read file.
    Args:
      file (str): Path / file name of file to read.
    Returns:
      data (str): Data read.
    Raises:
      SafeFileError
    """
    if file is None:
        raise SafeFileError (INVALID_NAME, MSG_INVALID_NAME)

    info = _getFileInfo (file)
    if not info["exists"]:
        raise SafeFileError (DOES_NOT_EXIST, MSG_DOES_NOT_EXIST.format (file))

    if not info["isFile"]:
        raise SafeFileError (IS_NOT_A_FILE, MSG_IS_NOT_A_FILE.format (file))

    # read data file
    try:
        data = open (file).read ()
        return data
    except IOError as e:
        raise SafeFileError (READ_ERROR,
            MSG_READ_ERROR.format (file, e.strerror))

def writeFile (file, data):
    """
    Write file.
    Args:
        file (str): Path / file name to write.
        data (str): Data to write.
    Raises:
        SafeFileError
    """
    if file is None:
        raise SafeFileError (INVALID_NAME, MSG_INVALID_NAME)

    info = _getFileInfo (file)
    if info["exists"] and not info["isFile"]:
        raise SafeFileError (IS_NOT_A_FILE, MSG_IS_NOT_A_FILE.format (file))

    # read data file
    try:
        file = open (file, "w")
        file.write (data)
        file.close ()
    except IOError as e:
        raise SafeFileError (WRITE_ERROR,
            MSG_WRITE_ERROR.format (file, e.strerror))

def safeGetState (file):
    """
    Get the status of a file in the recovery context.
    Args:
        file File to get status for.
    Retuns:
        State, can be an error or recovery state.
    """
    if file is None:
        return INVALID_NAME

    info = _getFileInfo (file)
    if info["exists"] and not info["isFile"]:
        return IS_NOT_A_FILE

    state = _getState (file)
    return state["status"]

def safeRecover (file):
    """
    Initiate the recovery processing for a file.
    Args:
        file File to performing processing for.
    Raises:
        SafeFileError
    """
    if file is None:
        raise SafeFileError (INVALID_NAME, MSG_INVALID_NAME)

    info = _getFileInfo (file)
    if info["exists"] and not info["isFile"]:
        raise SafeFileError (IS_NOT_A_FILE, MSG_IS_NOT_A_FILE.format (file))

    state = _getState (file)
    if state["status"] == DOES_NOT_EXIST:
        raise SafeFileError (DOES_NOT_EXIST, MSG_DOES_NOT_EXIST.format (file))

    _performRecovery (state, True)

def safeReadFile (file):
    """
    Read a file, applying recovery processing if necessary.
    Args:
        file File to read.
    Returns:
        Data read from file.
    Raises:
        SafeFileError
    """
    if file is None:
        raise SafeFileError (INVALID_NAME, MSG_INVALID_NAME)

    info = _getFileInfo (file)
    if info["exists"] and not info["isFile"]:
        raise SafeFileError (IS_NOT_A_FILE, MSG_IS_NOT_A_FILE.format (file))

    state = _getState (file)
    if state["status"] == SAFE_RECOVERABLE:
        _performRecovery (state, True)

    readFile (file)

def safeWriteFile (file, data):
    """
    Write data to a file, applying recovery enabling processing.
    Args:
        file File to write to.
        data Data to write.
    Raises:
        SafeFileError
    """
    if file is None:
        raise SafeFileError (INVALID_NAME, MSG_INVALID_NAME)

    info = _getFileInfo (file)
    if info["exists"] and not info["isFile"]:
        raise SafeFileError (IS_NOT_A_FILE, MSG_IS_NOT_A_FILE.format (file))

    # get current file system state, and auto-recover if necessary
    state = _getState (file)

    # store data in well defined ephemeral file to allow manual recovery.
    # If file already exists, remove it (failed prior recovery).
    if state["ephemeral"]["exists"]:
        unlink (state["ephemeral"]["name"])

    writeFile (state["ephemeral"]["name"], data)
    state["ephemeral"]["exists"] = True

    # if ready state file already exists, recover prior state
    if state["ready"]["exists"]:
        _performRecovery (state, False)

    rename (state["ephemeral"]["name"], state["ready"]["name"])

    # refresh state and process recovery to set file system state
    state = _getState (file)
    _performRecovery (state, True)

def _getState (file):
    """
    Get file state.
    Args:
        file File to get state for.
    Returns:
        State object containing list of recovery files and overall status.
    """
    state = {}
    state["ephemeral"] = _getFileInfo (file + ".eph")
    state["ready"] = _getFileInfo (file + ".rdy")
    state["base"] = _getFileInfo (file)
    state["backup"] = _getFileInfo (file + ".bak")
    state["tertiary"] = _getFileInfo (file + ".bk2")

    if state["ephemeral"]["exists"]:
        state["status"] = SAFE_INTERVENE
    elif state["ready"]["exists"] or state["tertiary"]["exists"]:
        state["status"] = SAFE_RECOVERABLE
    elif state["base"]["exists"]:
        state["status"] = SAFE_NORMAL
    else:
        if state["backup"]["exists"]:
            state["status"] = SAFE_RECOVERABLE
        else:
            state["status"] = DOES_NOT_EXIST

    return state

def _getFileInfo (file):
    """
    Get information for a file (name, exists, is a file or directory.
    Args:
        file File to get information for.
    Returns:
        Dict with file info (name, exists, isFile, isDirectory)
    """
    info = {}
    info["name"] = file
    info["exists"] = exists (file)
    info["isFile"] = isfile (file)
    info["isDirectory"] = isdir (file)
    return info

def _performRecovery (state, removeEphemeral):
    """
    Initiate recovery processing.
    Args:
        state State object with recovery file information.
        removeEphemeral Flag, remove ephemeral if found or not
    """
    # if ephemeral flag true, and ephemeral file exists, remove it
    if removeEphemeral and state["ephemeral"]["exists"]:
        unlink (state["ephemeral"]["name"])

    # if only backups exist, restore from backup
    baseAvailable = state["base"]["exists"] or state["ready"]["exists"]
    if not baseAvailable:
        if state["tertiary"]["exists"]:
            if state["backup"]["exists"]:
                rename (state["backup"]["name"], state["base"]["name"])
                rename (state["tertiary"]["name"], state["backup"]["name"])
            else:
                rename (state["tertiary"]["name"], state["base"]["name"])
        elif state["backup"]["exists"]:
            rename (state["backup"]["name"], state["base"]["name"])
        return

    # if tertiary state file exists, remove it
    if state["tertiary"]["exists"]:
        unlink (state["tertiary"]["name"])

    # if ready state file exists, update ready, base and backup files
    if state["ready"]["exists"]:
        removeTertiary = False

        # if base and backup exist, rename to tertiary temporarily
        if state["base"]["exists"] and state["backup"]["exists"]:
            rename (state["backup"]["name"], state["tertiary"]["name"])
            removeTertiary = True

        # if base exists, rename to backup
        if state["base"]["exists"]:
            rename (state["base"]["name"], state["backup"]["name"])

        # place ready state file in base and delete temporary tertiary file
        rename (state["ready"]["name"], state["base"]["name"])

        # if temporary tertiary created, remove it
        if removeTertiary:
            unlink (state["tertiary"]["name"])
