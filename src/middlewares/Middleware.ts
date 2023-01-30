import { BulkSync } from "../BulkSync.js";
import { BulkSyncSettings } from "../BulkSyncSettings.js";

export type Request<TRecordClass> = {
  currentRecords: TRecordClass[];
  newRecords: TRecordClass[];
  settings: BulkSyncSettings<TRecordClass>;
};

export class Middleware<TRecordClass> {
  constructor(public instance: BulkSync<TRecordClass>) {}

  public async handle(request: Request<TRecordClass>): Promise<void> {}
}
