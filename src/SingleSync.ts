import { Collection } from "dexie";
import { BulkSync } from "./BulkSync";
import { BulkSyncSettings } from "./BulkSyncSettings";
import { collectionWhere } from "./helpers/collectionWhere";

export class SingleSync<TRecordClass> {
  constructor(public bulkSyncInstance: BulkSync<TRecordClass>) {}

  protected makeWhereClause(
    item: TRecordClass,
    overrideSettings?: BulkSyncSettings<TRecordClass>,
  ): Record<string, any> {
    const fieldsIsSameRecord = overrideSettings?.fieldsIsSameRecord ??
      this.bulkSyncInstance.fieldsIsSameRecord ?? [
        this.bulkSyncInstance.getPrimaryKeyName(),
      ];

    return fieldsIsSameRecord.reduce((acc, key) => {
      acc[key] = (item as Record<string, any>)[key];

      return acc;
    }, {} as Record<string, any>);
  }

  public async executeOnTable(
    newRecord: TRecordClass,
    overrideSettings?: BulkSyncSettings<TRecordClass>,
  ): Promise<void> {
    const whereClause = this.makeWhereClause(newRecord, overrideSettings);

    const currentRecords = await this.bulkSyncInstance.table
      .where(whereClause)
      .toArray();

    await this.bulkSyncInstance.execute(
      currentRecords,
      [newRecord],
      overrideSettings,
    );
  }

  public async executeOnCollection(
    collection: Collection,
    newRecord: TRecordClass,
    overrideSettings?: BulkSyncSettings<TRecordClass>,
  ): Promise<void> {
    const whereClause = this.makeWhereClause(newRecord, overrideSettings);

    const currentRecords = await collectionWhere(
      collection,
      whereClause,
    ).toArray();

    await this.bulkSyncInstance.execute(
      currentRecords,
      [newRecord],
      overrideSettings,
    );
  }
}
