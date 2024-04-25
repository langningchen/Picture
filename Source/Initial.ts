import { Database } from "./Database";
import { DatabaseColumn } from "./DatabaseColumn";
import { Output } from "./Output";
import { ThrowErrorIfFailed } from "./Result";

export class Initial {
    private TableList = {
        Pictures: [
            new DatabaseColumn({ "Name": "ID", "Type": "TEXT", "NotNull": true }),
            new DatabaseColumn({ "Name": "CreateTime", "Type": "DATETIME", "NotNull": true, "DefaultValue": "CURRENT_TIMESTAMP" }),
        ],
        PictureChunks: [
            new DatabaseColumn({ "Name": "PictureID", "Type": "TEXT", "NotNull": true }),
            new DatabaseColumn({ "Name": "ChunkIndex", "Type": "INTEGER", "NotNull": true }),
            new DatabaseColumn({ "Name": "ChunkData", "Type": "TEXT", "NotNull": true }),
        ],
    }
    public async Init(DB: Database) {
        for (let i in this.TableList) {
            let IsSame: boolean = true;
            if (!ThrowErrorIfFailed(await DB.IfTableExists(i))["TableExists"]) {
                IsSame = false;
            }
            else {
                let TableStructure: Array<DatabaseColumn> = ThrowErrorIfFailed(await DB.GetTableStructure(i))["TableStructure"];
                if (TableStructure.length != this.TableList[i].length) {
                    IsSame = false;
                }
                else {
                    for (let j in TableStructure) {
                        if (TableStructure[j].ToString() != this.TableList[i][j].ToString()) {
                            Output.Warn(TableStructure[j].ToString() + " != " + this.TableList[i][j].ToString());
                            IsSame = false;
                            break;
                        }
                    }
                }
                if (!IsSame) {
                    ThrowErrorIfFailed(await DB.DropTable(i));
                }
            }
            if (!IsSame) {
                ThrowErrorIfFailed(await DB.CreateTable(i, this.TableList[i]));
                Output.Warn("Table \"" + i + "\" created");
            }
        }
    }
};