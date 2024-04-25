import { Result } from "./Result";

export class Utilities {
    static CheckParams = (Data: object, Checklist: object): Result => {
        for (let i in Data) {
            if (Checklist[i] === undefined) {
                return new Result(false, "Parameter " + i + " unknown");
            }
            const AvailableTypes = ["string", "number", "bigint", "boolean", "symbol", "undefined", "object", "function"];
            if (AvailableTypes.indexOf(Checklist[i]) === -1) {
                return new Result(false, "Parameter type " + Checklist[i] + " unknown");
            }
            if (typeof Data[i] !== Checklist[i]) {
                return new Result(false, "Parameter " + i + " expected type " + Checklist[i] + " actual type " + typeof Data[i]);
            }
        }
        for (let i in Checklist) {
            if (Data[i] === undefined) {
                return new Result(false, "Parameter " + i + " not found");
            }
        }
        return new Result(true, "Parameter check passed");
    }
    static GenerateRandomString = (Length: number, CharSet: string): string => {
        let Result = "";
        for (let i = 0; i < Length; i++) {
            Result += CharSet.charAt(Math.floor(Math.random() * CharSet.length));
        }
        return Result;
    }
    static SendEmail = async (To: string, Subject: string, Content: string): Promise<Result> => {
        const EmailHost = "smtp.example.email";
        const EmailPort = 587;
        const EmailUsername = "...";
        const EmailPassword = "...";


        return new Result(true, "Email sent");
    }
}