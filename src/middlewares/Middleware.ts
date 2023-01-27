import { BulkSync } from "../BulkSync.js";

export type Request<TRecordClass> = {
  currentRecords: TRecordClass[];
  newRecords: TRecordClass[];
};

export class Middleware<TRecordClass> {
  constructor(public instance: BulkSync<TRecordClass>) {}

  public async handle(request: Request<TRecordClass>): Promise<void> {}
}
