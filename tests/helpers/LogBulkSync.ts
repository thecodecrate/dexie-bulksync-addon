import { BulkSync } from "../../src/BulkSync";
import { AddMiddleware } from "../../src/middlewares/AddMiddleware";
import { DeleteMiddleware } from "../../src/middlewares/DeleteMiddleware";
import { Middleware } from "../../src/middlewares/Middleware";
import { UpdateMiddleware } from "../../src/middlewares/UpdateMiddleware";
import { LogMiddleware } from "./LogMiddleware";

export class LogBulkSync extends BulkSync<any> {
  public middlewares: Middleware<any>[] = [
    new LogMiddleware(this),
    new DeleteMiddleware(this),
    new AddMiddleware(this),
    new UpdateMiddleware(this),
  ];

  protected logs: string[] = [];

  public addLog(log: string) {
    this.logs.push(log);
  }

  public getLogs() {
    return this.logs;
  }
}
