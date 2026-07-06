import path from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";

export class R3transFile {

    constructor(public filePath: string, private _canDispose: boolean) {}

    public dispose() {
        if(this._canDispose){
            try{
                fs.unlinkSync(this.filePath);
            }catch(e){
                throw new Error(`Couldn't dispose file "${this.filePath}"`);
            }
        }
    }

    public getBuffer(): Buffer {
        return fs.readFileSync(this.filePath);
    }

    public static fromPath(filePath: string): R3transFile{
        return new R3transFile(filePath, false);
    }
    
    public static fromBuffer(tempDirPath: string, data: Buffer): R3transFile{
        const filePath = path.join(tempDirPath, randomUUID());
        fs.writeFileSync(filePath, data);
        return new R3transFile(filePath, true);
    }
}
