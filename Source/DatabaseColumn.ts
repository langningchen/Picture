export class DatabaseColumn {
    public Name: string;
    public Type: string;
    public NotNull: boolean;
    public DefaultValue: string;
    public PrimaryKey: boolean;
    public AutoIncrement: boolean;
    constructor(Data: object) {
        this.Name = Data["name"] || Data["Name"] || "";
        this.Type = Data["type"] || Data["Type"] || "";
        this.NotNull = Data["notnull"] || Data["NotNull"] || false;
        this.DefaultValue = Data["dflt_value"] || Data["DefaultValue"] || null;
        this.PrimaryKey = Data["pk"] || Data["PrimaryKey"] || false;
    }
    public ToString() {
        let SQL: string = "`" + this.Name + "` " + this.Type;
        if (this.NotNull) {
            SQL += " NOT NULL";
        }
        if (this.DefaultValue) {
            SQL += " DEFAULT " + (this.DefaultValue || "NULL");
        }
        if (this.PrimaryKey) {
            SQL += " PRIMARY KEY";
        }
        return SQL;
    }
}