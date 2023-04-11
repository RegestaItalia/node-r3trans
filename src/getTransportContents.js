const { l } = require('./commands');
const { parseLog, deleteLog } = require('./log');


module.exports = async (args) => {
    //args.dataFilePath = Path to transport data file
    //args.r3transPath = OPTIONAL Path to R3TRANS, defaults R3TRANS_HOME
    //args.tmpFolderPath = OPTIONAL Path to tmp folder (for log generation), defaults to R3TRANS folder
    const lCommand = await l({...args, ...{
        logLevel: 2
    }});
    const lCommandLogFile = lCommand.logFilePath;
    const parsedLog = await parseLog(lCommandLogFile);
    deleteLog(lCommandLogFile)
    return parsedLog;
}