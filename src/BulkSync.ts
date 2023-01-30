import { Table } from "dexie";
import { AddMiddleware } from "./middlewares/AddMiddleware.js";
import { DeleteMiddleware } from "./middlewares/DeleteMiddleware.js";
import { Middleware } from "./middlewares/Middleware.js";
import { UpdateMiddleware } from "./middlewares/UpdateMiddleware.js";

export class BulkSync<TRecordClass> {
  public fieldsIsSameRecord: string[] | null = null;

  public fieldsDataChanged: string[] | null = null;

  public fieldsToUpdate: string[] | null = null;

  public middlewares: Middleware<TRecordClass>[] = [
    new DeleteMiddleware(this),
    new AddMiddleware(this),
    new UpdateMiddleware(this),
  ];

  constructor(public table: Table<TRecordClass>) {}

  public getPrimaryKeyName(): keyof TRecordClass {
    return this.table.schema.primKey.keyPath as keyof TRecordClass;
  }

  public getFieldsIsSameRecord(): Array<keyof TRecordClass> {
    return (
      (this.fieldsIsSameRecord as Array<keyof TRecordClass> | null) ?? [
        this.getPrimaryKeyName(),
      ]
    );
  }

  public getFieldsDataChanged(): Array<keyof TRecordClass> | null {
    return this.fieldsDataChanged as Array<keyof TRecordClass> | null;
  }

  public getFieldsToUpdate(): Array<keyof TRecordClass> | null {
    return this.fieldsToUpdate as Array<keyof TRecordClass> | null;
  }

  public isSameRecord(recordA: TRecordClass, recordB: TRecordClass): boolean {
    return this.getFieldsIsSameRecord().every(
      (field) => recordA[field] === recordB[field],
    );
  }

  public async execute(
    currentRecords: TRecordClass[],
    newRecords: TRecordClass[],
  ): Promise<void> {
    for (const middleware of this.middlewares) {
      await middleware.handle({ currentRecords, newRecords });
    }
  }
}
