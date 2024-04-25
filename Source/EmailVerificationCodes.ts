import { Result, ThrowErrorIfFailed } from "./Result";
import { Utilities } from "./Utilities";

export class EmailVerificationCodes {
    static Has = async (EmailAddress: string): Promise<Result> => {
        let EmailVerificationCodeSize = ThrowErrorIfFailed(await DB.GetTableSize("EmailVerificationCodes", {
            EmailAddress: EmailAddress,
        }))["TableSize"];
        return new Result(EmailVerificationCodeSize === 0, "Email verification code " + (EmailVerificationCodeSize.length === 0 ? " not found" : " already exists"));
    }
    static Create = async (EmailAddress: string): Promise<Result> => {
        ThrowErrorIfFailed(await EmailVerificationCodes.Has(EmailAddress));
        let EmailVerificationCode = Utilities.GenerateRandomString(6, "0123456789");
        ThrowErrorIfFailed(await DB.Insert("EmailVerificationCodes", {
            VerificationCode: EmailVerificationCode,
            EmailAddress: EmailAddress,
        }));
        return new Result(true, "Email verification code created");
    }
    static Check = async (EmailAddress: string, EmailVerificationCode: string): Promise<Result> => {
        let EmailVerificationCodeInfo = ThrowErrorIfFailed(await DB.Select("EmailVerificationCodes", ["CreateTime"], {
            VerificationCode: EmailVerificationCode,
            EmailAddress: EmailAddress,
        }))["Results"];
    }
    static Delete = async (EmailAddress: string): Promise<Result> => {

    }
}

