const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports = async (args) => {
    var cwd;
    if(args.r3transPath){
        cwd = args.r3transPath;
    }else{
        cwd = process.env.R3TRANS_HOME;
    }
    if (!cwd) {
        throw new Error('Missing R3TRANS_HOME');
    }
    const logFileName = `${Date.now()}.log`;
    const logFilePath = `${args.tmpFolderPath || cwd}\\${logFileName}`;
    var logLevel;
    if(args.logLevel){
        logLevel = `-v ${args.logLevel}`;
    }else{
        logLevel = '';
    }
    await exec(`R3Trans -m ${args.dataFilePath} -w ${logFilePath} ${logLevel}`, {
        cwd
    });

    return {
        logFilePath
    }
}