import * as fs from "fs";
import * as readline from "readline";
import { Structure } from "./Structure";

export class R3transLogParser {
    private _tablesStructure: any;
    private _tableEntries: any;

    constructor(private _log: string) { }

    private _getStream(): fs.ReadStream {
        //if (typeof (this._log) === 'string') {
            return fs.createReadStream(this._log);
        //} else {
            //return this._log;
        //}
    }

    private _searchTableRegex(line: string): string {
        var currentTable;
        const tableNameRegex = /^\d*\s*ETW000\s*REP(?:C)?\s*(\S*)/gi;
        const tableNameMatch = tableNameRegex.exec(line);
        if (tableNameMatch !== null) {
            currentTable = tableNameMatch[1].trim();
        }
        return currentTable;
    }

    private _getTableRowRegex(tableName: string): RegExp {
        if (tableName === 'TADIR') {
            return /^\d*\s*ETW000\s*(TADIRENTRY)\s*/gi;
        } else {
            return /^\d*\s*ETW000\s*\*\*\s*(\d*)\s*\*\*\s{1}/gi;
        }
    }

    private _getNumerator(line: string, tableName: string): string {
        const tableRowRegex = this._getTableRowRegex(tableName);
        const numeratorMatches = tableRowRegex.exec(line);
        try {
            return numeratorMatches[1];
        } catch (e) {
            return null;
        }
    }

    private _isTableRow(tableName: string, numerator: string, line: string): boolean {
        const tableRowRegex = this._getTableRowRegex(tableName);
        const lineNumerator = this._getNumerator(line, tableName);
        if (numerator) {
            if (numerator === lineNumerator) {
                return tableRowRegex.test(line);
            } else {
                return false;
            }
        } else {
            return tableRowRegex.test(line);
        }
    }

    private _getTableRow(line: string, tableName: string): any {
        var record = {};
        const tableDescriptor = this._tablesStructure[tableName];
        if(!tableDescriptor){
            return;
        }
        const tableRowRegex = this._getTableRowRegex(tableName);
        var sTableRow = line.replace(tableRowRegex, '');
        for (const field of tableDescriptor.keys()) {
            const fieldLength = tableDescriptor.get(field);
            try {
                record[field] = sTableRow.substring(0, fieldLength).trim();
                sTableRow = sTableRow.slice(fieldLength);
            } catch (e) {
                throw new Error(`Reached the end of the line while parsing row of table ${tableName}.`);
            }
        }
        return record;
    }

    private _searchTableStructureRegex(line: string, tableName?: string): string {
        var currentTable: string;
        if (!tableName) {
            tableName = '.{30}';
        } else {
            tableName = tableName.toUpperCase();
        }
        const tableNameRegex = new RegExp(`^\\d*\\s*ETW000\\s*table\\s*description\\s*(${tableName})`, 'gi');
        const tableNameMatch = tableNameRegex.exec(line);
        if (tableNameMatch !== null) {
            currentTable = tableNameMatch[1].trim();
        }
        return currentTable;
    }

    private async _getTablesStructure(): Promise<any> {
        return await new Promise((res, rej) => {
            var currentTable: string;
            var tablesStructure: any = {};
            const stream = this._getStream();
            const rl = readline.createInterface({
                input: stream,
                crlfDelay: Infinity
            });
            rl.on('line', (line) => {
                if (!currentTable) {
                    currentTable = this._searchTableStructureRegex(line);
                } else {
                    if (!line.includes('comment')) { //skip comments -> SG they might have column order
                        const tableDescriptorRegex = /^\d*\s*ETW000\s*\*\*\s*38\s*\*\*\s{1}(X|\s{1})(\w{1})(\d*)(.{30})/gi;
                        const tableDescriptorMatch = tableDescriptorRegex.exec(line);
                        if (tableDescriptorMatch !== null) {
                            if (!tablesStructure[currentTable]) {
                                tablesStructure[currentTable] = new Map();
                            }
                            tablesStructure[currentTable].set(tableDescriptorMatch[4].trim(), parseInt(tableDescriptorMatch[3]) / 2);
                        } else {
                            currentTable = this._searchTableStructureRegex(line);
                        }
                    }
                }
            });

            rl.on('close', () => {
                res(tablesStructure);
            });
        });
    }

    private async _getTableEntries() {
        await this.getTableStructure(); //this will set the structures if not set yet
        return await new Promise((res, rej) => {
            var returnObject = {};
            var currentTable = null;
            var currentNumerator = null;
            const stream = this._getStream();
            const rl = readline.createInterface({
                input: stream,
                crlfDelay: Infinity
            });
            rl.on('line', (line) => {
                var tableRow;
                if (!currentTable) {
                    if (line.includes('TADIRENTRY')) {
                        currentTable = 'TADIR';
                        tableRow = this._getTableRow(line, currentTable);
                    } else {
                        currentTable = this._searchTableRegex(line);
                    }
                } else {
                    if (this._isTableRow(currentTable, currentNumerator, line)) {
                        if (!currentNumerator) {
                            currentNumerator = this._getNumerator(line, currentTable);
                        }
                        tableRow = this._getTableRow(line, currentTable);
                    } else {
                        currentTable = null;
                        currentNumerator = null;
                    }
                }

                if (tableRow && currentTable) {
                    if (!returnObject[currentTable]) {
                        returnObject[currentTable] = [];
                    }
                    returnObject[currentTable].push(tableRow);
                }
            });

            rl.on('close', () => {
                res(returnObject);
            });
        });
    }

    public async getTableStructure(tableName?: string): Promise<Structure | any> {
        if (!this._tablesStructure) {
            this._tablesStructure = await this._getTablesStructure();
        }
        if (tableName) {
            if (this._tablesStructure[tableName]) {
                return this._tablesStructure[tableName];
            } else {
                throw new Error(`Table "${tableName}" structure not found.`);
            }
        } else {
            return this._tablesStructure;
        }
    }

    public async getTableEntries(tableName?: string) {
        if(!this._tableEntries){
            this._tableEntries = await this._getTableEntries();
        }
        if(tableName){
            if(this._tableEntries[tableName]){
                return this._tableEntries[tableName];
            }else{
                return [];
            }
        }else{
            return this._tableEntries;
        }
    }

}