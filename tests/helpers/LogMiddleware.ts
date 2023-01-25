import { Middleware, Request } from "../../src/middlewares/Middleware";
import { LogBulkSync } from "./LogBulkSync";

export class LogMiddleware<TRecordClass> extends Middleware<TRecordClass> {
  public async handle(request: Request<TRecordClass>): Promise<void> {
    const instance = this.instance as any as LogBulkSync;

    instance.addLog(
      JSON.stringify({
        currentRecords: request.currentRecords,
        newRecords: request.newRecords,
      }),
    );
  }
}
