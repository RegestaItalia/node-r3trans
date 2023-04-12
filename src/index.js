const fs = require('fs');
const { l } = require('./commands/l');
const { deleteLog } = require('./log/deleteLog');

const _getDataFilePath = () => {
    if(this._dataFilePath){
        return this._dataFilePath;
    }else{
        
    }
}

module.exports = class R3Trans {

    constructor(arg1, arg2) {
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
            }else{
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
        return true;
    }

    async getTableEntries(tableName) {
        if (tableName) {
            if (typeof (tableName) !== 'string') {
                throw new Error(`Table "${tableName}" not found.`);
            }
            tableName = tableName.trim().toUpperCase();
        } else {

        }
        const commandResult = await l({

        });
        deleteLog(commandResult.logFilePath);
    }
}