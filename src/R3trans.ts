import { R3transOptions } from "./R3transOptions";
import * as fs from "fs";
import { R3transFile } from "./R3transFile";
import { exec } from "child_process";
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import { R3transLogParser } from "./R3transLogParser";
import { Structure } from "./Structure";
import { R3transDockerOptions } from "./R3transDockerOptions";

export class R3trans {
    public r3transDirPath: string;
    public tempDirPath: string;
    public useDocker: boolean;
    public dockerOptions: R3transDockerOptions;
    private _version: string;
    private _unicode: boolean;

    constructor(options?: R3transOptions) {
        if (options) {
            this.r3transDirPath = options.r3transDirPath || process.env.R3TRANS_HOME;
            this.tempDirPath = options.tempDirPath;
            this.useDocker = options.useDocker || false;
            this.dockerOptions = options.dockerOptions || { name: undefined };
            this.dockerOptions.name = this.dockerOptions.name || 'local/r3trans';
        } else {
            this.r3transDirPath = process.env.R3TRANS_HOME;
        }
        if (!this.r3transDirPath && !this.useDocker) {
            throw new Error(`R3TRANS_HOME environment variable is not defined.`);
        }
        if (!this.tempDirPath) {
            this.tempDirPath = this.r3transDirPath || process.cwd();
        }
        try {
            fs.accessSync(this.tempDirPath, fs.constants.W_OK);
        } catch (err) {
            throw new Error(`Temporary folder path (${this.tempDirPath}) doesn't have write access.`);
        }
    }

    private _exec(args?: string, log?: boolean, verbose?: number, dockerMounts?: {
        mount: string,
        dir: string,
        file: string
    }[]): Promise<{
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
            dockerMounts.push({
                mount: 'w',
                dir: path.dirname(logFilePath),
                file: path.basename(logFilePath)
            });
            if (verbose) {
                args = `${args} -v ${verbose}`;
            }
        }
        return new Promise((res, rej) => {
            var r3transExec = `${process.platform !== "win32" ? './' : ''}R3trans`;
            if (this.useDocker) {
                r3transExec = `docker run --rm `;
                (dockerMounts || []).forEach(o => {
                    r3transExec += `-v "${o.dir}:${path.sep}${o.mount}" `;
                    args = args.replace(new RegExp(`-${o.mount}\\s*${o.dir}${path.sep}${o.file}`, 'gmi'), `-${o.mount} ${path.sep}${o.mount}${path.sep}${o.file}`);
                });
                r3transExec += ` ${this.dockerOptions.name}`;
            }
            const fullCommand = `${r3transExec} ${args || ''}`.trim();
            exec(fullCommand, {
                cwd: this.r3transDirPath
            }, (error, stdout, stderr) => {
                const logFile = logFilePath ? new R3transFile(logFilePath, true) : null;
                if (error) {
                    if (error.code === 1) { //program not started
                        if (logFile) {
                            logFile.dispose();
                        }
                        rej(new Error(`Couldn't start R3trans in directory "${this.r3transDirPath}".`));
                    } else if (errorCodes.includes(error.code)) { //error code from r3trans program
                        if (args) {
                            if (logFile) {
                                logFile.dispose();
                            }
                            rej(new Error(stdout || error.message));
                        } else {
                            //test running... not an error!
                            res({
                                code: error.code,
                                output: stdout,
                                logFile
                            });
                        }
                    } else if (error.code !== 4) { //everything else except 4 (warning code)
                        //unknown error
                        //TODO: this can be handled better -> print stdout (it's cutting off right now)
                        if (logFile) {
                            logFile.dispose();
                        }
                        if(!this.useDocker){
                            rej(new Error(`Couldn't execute R3trans command.\nThis error might be caused by missing ICU common library.`));
                        }else{
                            rej(new Error(`Couldn't execute R3trans command.\nThis error might be caused by Docker not running or broken "${this.dockerOptions.name}" image.`));
                        }
                    } else {
                        res({
                            code: 4,
                            output: stdout,
                            logFile
                        });
                    }
                } else {
                    res({
                        code: 0,
                        output: stdout,
                        logFile
                    });
                }
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
                this._version = R3trans.getVersion(oExec.output);
            }
        }
        return this._version;
    }

    public static getVersion(log: string): string {
        try {
            return log.split(/\r?\n|\r|\n/g)[0];
        } catch (e) {
            return undefined;
        }
    }

    public async isUnicode(): Promise<boolean> {
        if (!this._unicode) {
            const oExec = await this._exec();
            if (oExec.code === 12) {
                this._unicode = R3trans.isUnicode(oExec.output);
            }
        }
        return this._unicode;
    }

    public static isUnicode(log: string): boolean {
        try {
            const outputLine = log.split(/\r?\n|\r|\n/g)[1];
            return !outputLine.startsWith('non-unicode');
        } catch (e) {
            return undefined;
        }
    }

    public async isTransportValid(data: string | Buffer): Promise<boolean> {
        var valid: boolean = false;
        const transport = this._getTransportFile(data);
        try {
            const oExec = await this._exec(`-l ${transport.filePath}`, true, undefined, [{
                mount: 'l',
                dir: path.dirname(transport.filePath),
                file: path.basename(transport.filePath)
            }]);
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
            const oExec = await this._exec(`-l ${transport.filePath}`, true, verbose, [{
                mount: 'l',
                dir: path.dirname(transport.filePath),
                file: path.basename(transport.filePath)
            }]);
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
            const oExec = await this._exec(`-l ${transport.filePath}`, true, 4, [{
                mount: 'l',
                dir: path.dirname(transport.filePath),
                file: path.basename(transport.filePath)
            }]);
            const parser = new R3transLogParser(oExec.logFile.filePath, await this.isUnicode());
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
            const oExec = await this._exec(`-l ${transport.filePath}`, true, 4, [{
                mount: 'l',
                dir: path.dirname(transport.filePath),
                file: path.basename(transport.filePath)
            }]);
            const parser = new R3transLogParser(oExec.logFile.filePath, await this.isUnicode());
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
        if (e070.length === 1) {
            return e070[0].TRKORR;
        } else {
            throw new Error('Trkorr not found.');
        }
    }
}