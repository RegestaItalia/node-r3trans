const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const path = require('path');

module.exports = async (args) => {
    var cwd;
    if (args.r3transPath) {
        cwd = args.r3transPath;
    } else {
        cwd = process.env.R3TRANS_HOME;
    }
    if (!cwd) {
        throw new Error('Missing R3TRANS_HOME');
    }
    const logFileName = `${Date.now()}.log`;
    const logFilePath = path.join(args.tmpFolderPath || cwd, logFileName);
    var logLevel;
    if (args.logLevel) {
        logLevel = `-v ${args.logLevel}`;
    } else {
        logLevel = '';
    }
    try {
        await exec(`R3Trans -l ${args.dataFilePath} -w ${logFilePath} ${logLevel}`, {
            cwd
        });
    } catch (error) {
        throw {
            error,
            logFilePath
        }
    }
    return {
        logFilePath
    }
}