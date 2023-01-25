import { IndexableType } from "dexie";
import { Middleware, Request } from "./Middleware";

export class DeleteMiddleware<TRecordClass> extends Middleware<TRecordClass> {
  public async handle(request: Request<TRecordClass>): Promise<void> {
    await this.instance.table.bulkDelete(
      this.getKeysToDelete(request.currentRecords, request.newRecords),
    );
  }

  protected getRecordsToDelete(
    currentRecords: TRecordClass[],
    newRecords: TRecordClass[],
  ): TRecordClass[] {
    return currentRecords.filter((currentRecord) => {
      return !newRecords.find((record) =>
        this.instance.isSameRecord(record, currentRecord),
      );
    });
  }

  protected getKeysToDelete(
    currentRecords: TRecordClass[],
    newRecords: TRecordClass[],
  ): IndexableType[] {
    return this.getRecordsToDelete(currentRecords, newRecords).map(
      (record) => record[this.instance.getPrimaryKeyName()] as IndexableType,
    );
  }
}
