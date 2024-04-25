import { Process } from "./Process";
import { Env } from "./Environment";
import { Initial } from "./Initial";
import { Database } from "./Database";

export default {
    async fetch(RequestData: Request, Environment: Env, Context: any) {
        let DB = new Database(Environment.DB);
        let Initializer = new Initial();
        await Initializer.Init(DB);
        let Processor = new Process(DB, RequestData);
        return await Processor.Process();
    },
};