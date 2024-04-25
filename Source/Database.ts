import { Result, ThrowErrorIfFailed } from "./Result";
import { Output } from "./Output";
import { D1Database } from "@cloudflare/workers-types";
import { DatabaseColumn } from "./DatabaseColumn";

export class Database {
    private RawDatabase: D1Database;
    constructor(RawDatabase: D1Database) {
        this.RawDatabase = RawDatabase;
    }
    private async Query(QueryString: string, BindData: string[]): Promise<Result> {
        Output.Debug("Executing SQL query: \n" +
            "    Query    : \"" + QueryString + "\"\n" +
            "    Arguments: " + JSON.stringify(BindData) + "\n");
        try {
            let SQLResult = await this.RawDatabase.prepare(QueryString).bind(...BindData).all();
            Output.Debug("SQL query returned with result: \n" +
                "    Result: \"" + JSON.stringify(SQLResult) + "\"\n");
            return new Result(true, "Database query succeeded", {
                Results: SQLResult["results"],
            });
        } catch (ErrorDetail) {
            ErrorDetail = ErrorDetail.toString().substring(7);
            Output.Warn("Error while executing SQL query: \n" +
                "    Query    : \"" + QueryString + "\"\n" +
                "    Arguments: " + JSON.stringify(BindData) + "\n" +
                "    Error    : \"" + ErrorDetail + "\"");
            return new Result(false, "Database query failed: " + String(ErrorDetail));
        }
    }
    public async Insert(Table: string, Data: object): Promise<Result> {
        let QueryString = "INSERT INTO `" + Table + "` (";
        for (let i in Data) {
            QueryString += "`" + i + "`, ";
        }
        QueryString = QueryString.substring(0, QueryString.length - 2);
        QueryString += ") VALUES (";
        for (let i in Data) {
            QueryString += "?, ";
        }
        QueryString = QueryString.substring(0, QueryString.length - 2);
        QueryString += ");";
        let BindData = Array();
        for (let i in Data) {
            BindData.push(Data[i]);
        }
        ThrowErrorIfFailed(await this.Query(QueryString, BindData));
        return new Result(true, "Database insertion succeeded");
    }
    public async Select(Table: string, Data: string[], Condition?: object, Other?: object, Distinct?: boolean): Promise<Result> {
        let QueryString = "SELECT ";
        if (Distinct !== undefined && Distinct) {
            QueryString += "DISTINCT ";
        }
        if (Data.length == 0) {
            QueryString += "*";
        }
        else {
            for (let i in Data) {
                QueryString += "`" + Data[i] + "`, ";
            }
            QueryString = QueryString.substring(0, QueryString.length - 2);
        }
        QueryString += " FROM `" + Table + "`";
        if (Condition !== undefined) {
            QueryString += " WHERE ";
            for (let i in Condition) {
                if (typeof Condition[i] != "object") {
                    QueryString += "`" + i + "` = ? AND ";
                }
                else {
                    QueryString += "`" + i + "` " + Condition[i]["Operator"] + " ? AND ";
                }
            }
            QueryString = QueryString.substring(0, QueryString.length - 5);
        }
        if (Other !== undefined) {
            if ((Other["Order"] !== undefined && Other["OrderIncreasing"] === undefined) ||
                (Other["Order"] === undefined && Other["OrderIncreasing"] !== undefined)) {
                return new Result(false, "Sort key and sort order must be defined or undefined at the same time");
            }
            if (Other["Order"] !== undefined && Other["OrderIncreasing"] !== undefined) {
                QueryString += " ORDER BY `" + Other["Order"] + "` " + (Other["OrderIncreasing"] ? "ASC" : "DESC");
            }
            if (Other["Limit"] !== undefined) {
                QueryString += " LIMIT " + Other["Limit"];
            }
            if (Other["Offset"] !== undefined) {
                QueryString += " OFFSET " + Other["Offset"];
            }
        }
        QueryString += ";";
        let BindData = Array();
        for (let i in Condition) {
            if (typeof Condition[i] != "object") {
                BindData.push(Condition[i]);
            }
            else {
                BindData.push(Condition[i]["Value"]);
            }
        }
        return new Result(true, "Database query succeeded", ThrowErrorIfFailed(await this.Query(QueryString, BindData)));
    }
    public async Update(Table: string, Data: object, Condition?: object): Promise<Result> {
        let QueryString = "UPDATE `" + Table + "` SET ";
        for (let i in Data) {
            QueryString += "`" + i + "` = ?, ";
        }
        QueryString = QueryString.substring(0, QueryString.length - 2);
        if (Condition !== undefined) {
            QueryString += " WHERE ";
            for (let i in Condition) {
                if (typeof Condition[i] != "object") {
                    QueryString += "`" + i + "` = ? AND ";
                }
                else {
                    QueryString += "`" + i + "` " + Condition[i]["Operator"] + " ? AND ";
                }
            }
            QueryString = QueryString.substring(0, QueryString.length - 5);
        }
        QueryString += ";";
        let BindData = Array();
        for (let i in Data) {
            BindData.push(Data[i]);
        }
        for (let i in Condition) {
            if (typeof Condition[i] != "object") {
                BindData.push(Condition[i]);
            }
            else {
                BindData.push(Condition[i]["Value"]);
            }
        }
        return new Result(true, "Database update succeeded", ThrowErrorIfFailed(await this.Query(QueryString, BindData)));
    }
    public async GetTableSize(Table: string, Condition?: object): Promise<Result> {
        let QueryString = "SELECT COUNT(*) FROM `" + Table + "`";
        if (Condition !== undefined) {
            QueryString += " WHERE ";
            for (let i in Condition) {
                if (typeof Condition[i] != "object") {
                    QueryString += "`" + i + "` = ? AND ";
                }
                else {
                    QueryString += "`" + i + "` " + Condition[i]["Operator"] + " ? AND ";
                }
            }
            QueryString = QueryString.substring(0, QueryString.length - 5);
        }
        QueryString += ";";
        let BindData = Array();
        for (let i in Condition) {
            if (typeof Condition[i] != "object") {
                BindData.push(Condition[i]);
            }
            else {
                BindData.push(Condition[i]["Value"]);
            }
        }
        return new Result(true, "Database got size succeeded", {
            "TableSize": ThrowErrorIfFailed(await this.Query(QueryString, BindData))["Results"][0]["COUNT(*)"]
        });
    }
    public async Delete(Table: string, Condition?: object): Promise<Result> {
        let QueryString = "DELETE FROM `" + Table + "`";
        if (Condition !== undefined) {
            QueryString += " WHERE ";
            for (let i in Condition) {
                if (typeof Condition[i] != "object") {
                    QueryString += "`" + i + "` = ? AND ";
                }
                else {
                    QueryString += "`" + i + "` " + Condition[i]["Operator"] + " ? AND ";
                }
            }
            QueryString = QueryString.substring(0, QueryString.length - 4);
        }
        QueryString += ";";
        let BindData = Array();
        for (let i in Condition) {
            if (typeof Condition[i] != "object") {
                BindData.push(Condition[i]);
            }
            else {
                BindData.push(Condition[i]["Value"]);
            }
        }
        return new Result(true, "Database deletion succeeded", ThrowErrorIfFailed(await this.Query(QueryString, BindData)));
    }
    public async CreateTable(Table: string, Data: DatabaseColumn[]): Promise<Result> {
        let QueryString = "CREATE TABLE `" + Table + "` (";
        for (let i in Data) {
            QueryString += Data[i].ToString() + ", ";
        }
        QueryString = QueryString.substring(0, QueryString.length - 2);
        QueryString += ");";
        return new Result(true, "Database table creation succeeded", ThrowErrorIfFailed(await this.Query(QueryString, [])));
    }
    public async DropTable(Table: string): Promise<Result> {
        let QueryString = "DROP TABLE `" + Table + "`;";
        return new Result(true, "Database table deletion succeeded", ThrowErrorIfFailed(await this.Query(QueryString, [])));
    }
    public async IfTableExists(Table: string): Promise<Result> {
        let QueryString = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?;";
        return new Result(true, "Database table existence check succeeded", {
            "TableExists": ThrowErrorIfFailed(await this.Query(QueryString, [Table]))["Results"][0]["COUNT(*)"] == 1
        });
    }
    public async GetTableStructure(Table: string): Promise<Result> {
        let QueryString = "PRAGMA table_info(`" + Table + "`);";
        let SQLResult = ThrowErrorIfFailed(await this.Query(QueryString, []))["Results"];
        let TableStructure = Array<DatabaseColumn>();
        for (let i in SQLResult) {
            TableStructure.push(new DatabaseColumn(SQLResult[i]));
        }
        return new Result(true, "Database table structure retrieval succeeded", {
            TableStructure
        });
    }
}
