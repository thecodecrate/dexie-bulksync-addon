import { IndexableType } from "dexie";
import { BulkSyncSettings } from "../BulkSyncSettings.js";
import { Middleware, Request } from "./Middleware.js";

type KeyChange = {
  keyFrom: IndexableType;
  keyTo: IndexableType;
};

export type RecordsToUpdate<TRecordClass> = {
  keyChanges: KeyChange[];
  values: TRecordClass[];
};

export class UpdateMiddleware<TRecordClass> extends Middleware<TRecordClass> {
  public async handle(request: Request<TRecordClass>): Promise<void> {
    const { values, keyChanges } = this.getRecordsToUpdate(
      request.settings,
      request.currentRecords,
      request.newRecords,
    );

    await this.updateKeys(keyChanges, this.instance.getPrimaryKeyName());

    await this.instance.table.bulkPut(values);
  }

  protected getRecordsToUpdate(
    settings: BulkSyncSettings<TRecordClass>,
    currentRecords: TRecordClass[],
    newRecords: TRecordClass[],
  ): RecordsToUpdate<TRecordClass> {
    const values: TRecordClass[] = [];

    const keyChanges: (KeyChange | null)[] = [];

    currentRecords.forEach((currentRecord) => {
      const newRecord = this.findEquivalentInList(
        settings,
        currentRecord,
        newRecords,
      );

      const updatedRecord: TRecordClass = {
        ...currentRecord,
        ...this.filterUpdateableFields(settings, newRecord),
      };

      if (!this.shouldUpdate(settings, currentRecord, updatedRecord)) {
        return;
      }

      values.push(updatedRecord);

      keyChanges.push(this.makeKeyChange(currentRecord, updatedRecord));
    });

    return {
      keyChanges: keyChanges.filter((item) => !!item) as KeyChange[],
      values,
    };
  }

  protected shouldUpdate(
    settings: BulkSyncSettings<TRecordClass>,
    currentData: TRecordClass,
    updatedData: TRecordClass,
  ): boolean {
    const fieldsHasDataChanged = (settings.fieldsDataChanged ??
      Object.keys(currentData as object)) as Array<keyof TRecordClass>;

    return fieldsHasDataChanged.some(
      (field) => currentData[field] !== updatedData[field],
    );
  }

  protected filterUpdateableFields(
    settings: BulkSyncSettings<TRecordClass>,
    newData: TRecordClass | null,
  ): TRecordClass {
    if (!newData) {
      return {} as TRecordClass;
    }

    const fieldsToUpdate = (settings.fieldsToUpdate ??
      Object.keys(newData as object)) as Array<keyof TRecordClass>;

    return fieldsToUpdate.reduce(
      (acc, field) => ({
        ...acc,
        [field]: newData[field],
      }),
      {} as TRecordClass,
    );
  }

  protected findEquivalentInList(
    settings: BulkSyncSettings<TRecordClass>,
    originalRecord: TRecordClass,
    list: TRecordClass[],
  ): TRecordClass | null {
    return (
      list.find((listItem) =>
        settings.isSameRecord(listItem, originalRecord),
      ) ?? null
    );
  }

  protected makeKeyChange(
    recordFrom: TRecordClass,
    recordTo: TRecordClass,
  ): KeyChange | null {
    const keyFrom = this.instance.getPrimaryKeyValue(recordFrom);

    const keyTo = this.instance.getPrimaryKeyValue(recordTo);

    if (keyFrom === keyTo) {
      return null;
    }

    return {
      keyFrom,
      keyTo,
    };
  }

  protected async updateKeys(
    keyChanges: KeyChange[],
    primaryKeyName: string,
  ): Promise<void> {
    for (const { keyFrom, keyTo } of keyChanges) {
      await this.instance.table.update(keyFrom, {
        [primaryKeyName]: keyTo,
      });
    }
  }
}
