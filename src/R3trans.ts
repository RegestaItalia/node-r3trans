import { R3transOptions } from "./R3transOptions";
import * as fs from "fs";
import { R3transFile } from "./R3transFile";
import { exec } from "child_process";
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import { R3transLogParser } from "./R3transLogParser";
import { Structure } from "./Structure";

export class R3trans {
    public r3transDirPath: string;
    public tempDirPath: string;
    private _version: string;

    constructor(options?: R3transOptions) {
        if (options) {
            this.r3transDirPath = options.r3transDirPath || process.env.R3TRANS_HOME;
            this.tempDirPath = options.tempDirPath;
        } else {
            this.r3transDirPath = process.env.R3TRANS_HOME;
        }
        if (!this.r3transDirPath) {
            throw new Error(`R3TRANS_HOME path is not defined.`);
        }
        if (!this.tempDirPath) {
            try {
                fs.accessSync(this.r3transDirPath, fs.constants.W_OK);
                this.tempDirPath = this.r3transDirPath;
            } catch (err) {
                throw new Error(`R3TRANS_HOME path doesn't have write access.`);
            }
        } else {
            try {
                fs.accessSync(this.tempDirPath, fs.constants.W_OK);
            } catch (err) {
                throw new Error(`Temporary file path doesn't have write access.`);
            }
        }
    }

    private _exec(args?: string, log?: boolean, verbose?: number): Promise<{
        output: string,
        logFile?: R3transFile,
        code: number
    }> {
        var logFilePath;
        const errorCodes = [8, 12, 16];
        if (log) {
            const logFileName = `${uuidv4()}.log`;
            logFilePath = path.join(this.tempDirPath, logFileName);
            args = `${args} -w ${logFilePath}`;
            if (verbose) {
                args = `${args} -v ${verbose}`;
            }
        }
        return new Promise((res, rej) => {
            exec(`R3trans ${args || ''}`, {
                cwd: this.r3transDirPath
            }, (error, stdout, stderr) => {
                if (args) {
                    if (error && errorCodes.includes(error.code)) {
                        rej(error)
                    }
                }
                res({
                    code: error ? error.code : 0,
                    output: stdout,
                    logFile: logFilePath ? new R3transFile(logFilePath, true) : null
                });
            });
        });
    }

    private _getTransportFile(data: string | Buffer): R3transFile {
        if (Buffer.isBuffer(data)) {
            return R3transFile.fromBuffer(this.tempDirPath, data);
        } else {
            return R3transFile.fromPath(data);
        }
    }

    public async getVersion(): Promise<string> {
        if (!this._version) {
            const oExec = await this._exec();
            if (oExec.code === 12) {
                try {
                    this._version = oExec.output.split(/\r?\n|\r|\n/g)[0];
                } catch (e) {
                    //
                }
            }
        }
        return this._version;
    }

    public async isTransportValid(data: string | Buffer): Promise<boolean> {
        var valid: boolean = false;
        const transport = this._getTransportFile(data);
        try {
            const oExec = await this._exec(`-l ${transport.filePath}`, true);
            oExec.logFile.dispose();
            valid = true;
        } catch (e) {
            valid = false;
        } finally {
            transport.dispose();
        }
        return valid;
    }

    public async getLogBuffer(data: string | Buffer, verbose?: number): Promise<Buffer> {
        var buffer: Buffer;
        const transport = this._getTransportFile(data);
        try {
            const oExec = await this._exec(`-l ${transport.filePath}`, true, verbose);
            buffer = oExec.logFile.getBuffer();
            oExec.logFile.dispose();
        } catch (e) {
            throw e;
        } finally {
            transport.dispose();
        }
        return buffer;
    }

    public async getTableStructure(data: string | Buffer, tableName?: string): Promise<Structure | any> {
        var tableStructure;
        const transport = this._getTransportFile(data);
        try {
            const oExec = await this._exec(`-l ${transport.filePath}`, true, 4);
            const parser = new R3transLogParser(oExec.logFile.filePath);
            tableStructure = await parser.getTableStructure(tableName);
            oExec.logFile.dispose();
        } catch (e) {
            throw e;
        } finally {
            transport.dispose();
        }
        return tableStructure;
    }

    public async getTableEntries(data: string | Buffer, tableName?: string): Promise<any> {
        var tableEntries;
        const transport = this._getTransportFile(data);
        try {
            const oExec = await this._exec(`-l ${transport.filePath}`, true, 4);
            const parser = new R3transLogParser(oExec.logFile.filePath);
            tableEntries = await parser.getTableEntries(tableName);
            oExec.logFile.dispose();
        } catch (e) {
            throw e;
        } finally {
            transport.dispose();
        }
        return tableEntries;
    }

    public async getTransportTrkorr(data: string | Buffer): Promise<string> {
        const e070 = await this.getTableEntries(data, 'E070');
        if(e070.length === 1){
            return e070[0].TRKORR;
        }else{
            throw new Error('Trkorr not found.');
        }
    }
}