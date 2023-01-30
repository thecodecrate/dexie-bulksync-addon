import { IndexableType } from "dexie";
import { BulkSyncSettings } from "../BulkSyncSettings.js";
import { Middleware, Request } from "./Middleware.js";

export class DeleteMiddleware<TRecordClass> extends Middleware<TRecordClass> {
  public async handle(request: Request<TRecordClass>): Promise<void> {
    await this.instance.table.bulkDelete(
      this.getKeysToDelete(
        request.settings,
        request.currentRecords,
        request.newRecords,
      ),
    );
  }

  protected getRecordsToDelete(
    settings: BulkSyncSettings<TRecordClass>,
    currentRecords: TRecordClass[],
    newRecords: TRecordClass[],
  ): TRecordClass[] {
    return currentRecords.filter((currentRecord) => {
      return !newRecords.find((record) =>
        settings.isSameRecord(record, currentRecord),
      );
    });
  }

  protected getKeysToDelete(
    settings: BulkSyncSettings<TRecordClass>,
    currentRecords: TRecordClass[],
    newRecords: TRecordClass[],
  ): IndexableType[] {
    return this.getRecordsToDelete(settings, currentRecords, newRecords).map(
      (record) => this.instance.getPrimaryKeyValue(record),
    );
  }
}
