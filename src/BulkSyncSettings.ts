import { Middleware } from "./middlewares/Middleware.js";

export class BulkSyncSettings<TRecordClass> {
  public fieldsIsSameRecord?: string[];
  public fieldsDataChanged?: string[];
  public fieldsToUpdate?: string[];
  public middlewares?: Middleware<TRecordClass>[];

  public constructor(settings: Partial<BulkSyncSettings<TRecordClass>> = {}) {
    Object.assign(this, settings);
  }

  public isSameRecord(recordA: TRecordClass, recordB: TRecordClass): boolean {
    return (this.fieldsIsSameRecord ?? []).every(
      (field) =>
        recordA[field as keyof TRecordClass] ===
        recordB[field as keyof TRecordClass],
    );
  }

  public mergeWith(overrideSettings?: BulkSyncSettings<TRecordClass>) {
    if (!overrideSettings) {
      return this;
    }

    const fieldsToMerge = [
      "fieldsIsSameRecord",
      "fieldsDataChanged",
      "fieldsToUpdate",
      "middlewares",
    ] as Array<keyof BulkSyncSettings<TRecordClass>>;

    for (const field of fieldsToMerge) {
      if (overrideSettings[field]) {
        (this as Record<string, any>)[field] = overrideSettings[field];
      }
    }

    return this;
  }
}
