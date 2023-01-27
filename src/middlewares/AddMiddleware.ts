import { Middleware, Request } from "./Middleware.js";

export class AddMiddleware<TRecordClass> extends Middleware<TRecordClass> {
  public async handle(request: Request<TRecordClass>): Promise<void> {
    await this.instance.table.bulkAdd(
      this.getRecordsToAdd(request.currentRecords, request.newRecords),
    );
  }

  protected getRecordsToAdd(
    currentRecords: TRecordClass[],
    newRecords: TRecordClass[],
  ): TRecordClass[] {
    return newRecords.filter((newRecord) => {
      return !currentRecords.find((record) =>
        this.instance.isSameRecord(record, newRecord),
      );
    });
  }
}
