import { IndexableType, Table } from "dexie";
import { BulkSyncSettings } from "./BulkSyncSettings.js";
import { AddMiddleware } from "./middlewares/AddMiddleware.js";
import { DeleteMiddleware } from "./middlewares/DeleteMiddleware.js";
import { Middleware } from "./middlewares/Middleware.js";
import { UpdateMiddleware } from "./middlewares/UpdateMiddleware.js";

export class BulkSync<TRecordClass> {
  public fieldsIsSameRecord?: string[];

  public fieldsDataChanged?: string[];

  public fieldsToUpdate?: string[];

  public middlewares: Middleware<TRecordClass>[] = [
    new DeleteMiddleware(this),
    new AddMiddleware(this),
    new UpdateMiddleware(this),
  ];

  constructor(public table: Table<TRecordClass>) {}

  public getPrimaryKeyName(): string {
    const fieldName = this.table.schema.primKey.keyPath;

    if (Array.isArray(fieldName)) {
      throw new Error("Composite primary keys are not supported");
    }

    if (typeof fieldName !== "string") {
      throw new Error("Primary key is not a string");
    }

    return fieldName;
  }

  public getPrimaryKeyValue(record: TRecordClass): IndexableType {
    const fieldName = this.getPrimaryKeyName() as keyof TRecordClass;

    return record[fieldName] as IndexableType;
  }

  public async execute(
    currentRecords: TRecordClass[],
    newRecords: TRecordClass[],
    overrideSettings?: BulkSyncSettings<TRecordClass>,
  ): Promise<void> {
    const settings = new BulkSyncSettings<TRecordClass>({
      fieldsIsSameRecord: this.fieldsIsSameRecord ?? [this.getPrimaryKeyName()],
      fieldsDataChanged: this.fieldsDataChanged,
      fieldsToUpdate: this.fieldsToUpdate,
      middlewares: this.middlewares,
    }).mergeWith(overrideSettings);

    for (const middleware of settings.middlewares ?? []) {
      await middleware.handle({ currentRecords, newRecords, settings });
    }
  }
}
