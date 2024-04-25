import { Result, ThrowErrorIfFailed } from "./Result";
import { Output } from "./Output";
import { Utilities } from "./Utilities";
import { Database } from "./Database";

export class API {
    private DB: Database;
    private APIName: string;
    private RequestJSON: object;
    private ProcessFunctions = {
        GetPictures: async (Data: object): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(Data, {}));
            let PicturesData = ThrowErrorIfFailed(await this.DB.Select("Pictures", []))["Results"];
            let Results = Array();
            for (let i in PicturesData) {
                let ID = PicturesData[i]["ID"];
                let CreateTime = PicturesData[i]["CreateTime"];
                let ChunksData = ThrowErrorIfFailed(await this.DB.Select("PictureChunks", ["ChunkData"], { "PictureID": ID }, {
                    Order: "ChunkIndex",
                    OrderIncreasing: true,
                }))["Results"];
                let Base64 = "";
                for (let j in ChunksData) {
                    Base64 += ChunksData[j]["ChunkData"];
                }
                Results.push({
                    "ID": ID,
                    "CreateTime": CreateTime,
                    "Base64": Base64,
                });
            }
            return new Result(true, "获取图片列表成功", Results);
        },
        UploadPicture: async (Data: object): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(Data, {
                Base64: "string",
            }));
            let Base64 = Data["Base64"];
            let ID = Utilities.GenerateRandomString(32, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
            let ChunkSize = 1000000 * 0.75;
            let ChunkCount = Math.ceil(Base64.length / ChunkSize);
            for (let i = 0; i < ChunkCount; i++) {
                let ChunkData = Base64.substr(i * ChunkSize, ChunkSize);
                ThrowErrorIfFailed(await this.DB.Insert("PictureChunks", {
                    "PictureID": ID,
                    "ChunkIndex": i,
                    "ChunkData": ChunkData,
                }));
            }
            ThrowErrorIfFailed(await this.DB.Insert("Pictures", {
                "ID": ID,
            }));
            return new Result(true, "上传图片成功");
        },
        ClearPictures: async (Data: object): Promise<Result> => {
            ThrowErrorIfFailed(Utilities.CheckParams(Data, {}));
            ThrowErrorIfFailed(await this.DB.Delete("Pictures"));
            ThrowErrorIfFailed(await this.DB.Delete("PictureChunks"));
            return new Result(true, "清空图片列表成功");
        },
    };

    constructor(DB: Database, APIName: string, RequestJSON: object) {
        this.DB = DB;
        this.APIName = APIName;
        this.RequestJSON = RequestJSON;
        Output.Debug("API request: \n" +
            "APIName    : \"" + this.APIName + "\"\n" +
            "RequestJSON: " + JSON.stringify(this.RequestJSON));
    }

    public async Process(): Promise<object> {
        try {
            if (this.ProcessFunctions[this.APIName] === undefined) {
                throw new Result(false, "The page you are trying to access does not exist");
            }
            throw await this.ProcessFunctions[this.APIName](this.RequestJSON);
        } catch (ResponseData) {
            if (!(ResponseData instanceof Result)) {
                Output.Error(ResponseData);
                ResponseData = new Result(false, "Server error: " + String(ResponseData).split("\n")[0]);
            }
            return ResponseData;
        }
    }
}
