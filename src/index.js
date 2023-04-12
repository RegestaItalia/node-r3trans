const fs = require('fs');
const { l } = require('./commands');
const { deleteLog } = require('./log');
const { getTableStructure, getTableEntries } = require('./table');
const { getDataFile } = require('./utils');

module.exports = class R3Trans {

    constructor(arg1, arg2) {
        if (!arg2) {
            arg2 = {};
        }
        if (typeof (arg2) === 'object') {
            this._r3transHome = arg2.r3transHome || process.env.R3TRANS_HOME;
            if (!this._r3transHome) {
                throw new Error(`R3TRANS_HOME path is not defined.`);
            }
            this._tmpFolderPath = arg2.tmpFolderPath;
            if (!this._tmpFolderPath) {
                try {
                    fs.accessSync(this._r3transHome, fs.constants.W_OK);
                    this._tmpFolderPath = this._r3transHome;
                } catch (err) {
                    throw new Error(`R3TRANS_HOME path doesn't have write access.`);
                }
            } else {
                try {
                    fs.accessSync(this._tmpFolderPath, fs.constants.W_OK);
                } catch (err) {
                    throw new Error(`Temporary file path doesn't have write access.`);
                }
            }
        }
        if (typeof (arg1) === 'string') {
            if (fs.existsSync(arg1)) {
                this._dataFilePath = arg1;
            } else {
                throw new Error(`File "${arg1}" not found.`);
            }
        } else if (Buffer.isBuffer(arg1)) {
            this._dataFileBuffer = arg1;
        } else {
            throw new Error(`Transport data file is not defined.`);
        }
    }

    async isValid() {
        var valid;
        const logFilePath = this._tmpFolderPath;
        const dataFile = getDataFile(this._dataFilePath, this._tmpFolderPath, this._dataFileBuffer);
        const dataFilePath = dataFile.getPath();
        var commandResult;
        try {
            commandResult = await l({
                dataFilePath,
                logFilePath
            });
            valid = true;
        } catch (e) {
            valid = false;
            commandResult = {
                logFilePath: e.logFilePath
            }
        } finally {
            if(commandResult){
                deleteLog(commandResult.logFilePath);
            }
            dataFile.dispose();
        }
        return valid;
    }

    async getTableEntries(tableName) {
        if (tableName) {
            if (typeof (tableName) !== 'string') {
                throw new Error(`Table "${tableName}" not found.`);
            }
            tableName = tableName.trim().toUpperCase();
        }
        const logFilePath = this._tmpFolderPath;
        const dataFile = getDataFile(this._dataFilePath, this._tmpFolderPath, this._dataFileBuffer);
        const dataFilePath = dataFile.getPath();
        const commandResult = await l({
            dataFilePath,
            logFilePath,
            logLevel: 2
        });
        var tableEntries;
        try {
            const tables = await getTableStructure({
                logFilePath: commandResult.logFilePath,
                tableName
            });
            tableEntries = await getTableEntries({
                logFilePath: commandResult.logFilePath,
                tables
            });
        } catch (e) {
            if(e.error){
                throw e.error;
            }else{
                throw e;
            }
        } finally {
            deleteLog(commandResult.logFilePath);
            dataFile.dispose();
        }
        if (tableName) {
            return tableEntries[tableName] || [];
        } else {
            return tableEntries;
        }
    }
}