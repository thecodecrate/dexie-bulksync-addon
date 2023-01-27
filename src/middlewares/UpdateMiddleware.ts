import { IndexableType } from "dexie";
import { Middleware, Request } from "./Middleware.js";

type KeyChange = {
  keyBefore: IndexableType;
  keyAfter: IndexableType;
};

export type RecordsToUpdate<TRecordClass> = {
  keyChanges: KeyChange[];
  values: TRecordClass[];
};

export class UpdateMiddleware<TRecordClass> extends Middleware<TRecordClass> {
  public async handle(request: Request<TRecordClass>): Promise<void> {
    const { values, keyChanges } = this.getRecordsToUpdate(
      request.currentRecords,
      request.newRecords,
    );

    await this.updateKeys(
      keyChanges,
      this.instance.getPrimaryKeyName() as string,
    );

    await this.instance.table.bulkPut(values);
  }

  protected getRecordsToUpdate(
    currentRecords: TRecordClass[],
    newRecords: TRecordClass[],
  ): RecordsToUpdate<TRecordClass> {
    const values: TRecordClass[] = [];

    const keyChanges: (KeyChange | null)[] = [];

    currentRecords.forEach((currentRecord) => {
      const newRecord = this.findEquivalentInList(currentRecord, newRecords);

      const updatedRecord: TRecordClass = {
        ...currentRecord,
        ...this.filterUpdateableFields(newRecord),
      };

      if (!this.shouldUpdate(currentRecord, updatedRecord)) {
        return;
      }

      values.push(updatedRecord);

      keyChanges.push(this.calculateKeyChange(currentRecord, updatedRecord));
    });

    return {
      keyChanges: keyChanges.filter((item) => !!item) as KeyChange[],
      values,
    };
  }

  protected shouldUpdate(
    currentData: TRecordClass,
    updatedData: TRecordClass,
  ): boolean {
    const fieldsHasDataChanged =
      this.instance.getFieldsDataChanged() ??
      (Object.keys(currentData as object) as Array<keyof TRecordClass>);

    return fieldsHasDataChanged.some(
      (field) => currentData[field] !== updatedData[field],
    );
  }

  protected filterUpdateableFields(newData: TRecordClass | null): TRecordClass {
    if (!newData) {
      return {} as TRecordClass;
    }

    const fieldsToUpdate =
      this.instance.getFieldsToUpdate() ??
      (Object.keys(newData as object) as Array<keyof TRecordClass>);

    return fieldsToUpdate.reduce(
      (acc, field) => ({
        ...acc,
        [field]: newData[field],
      }),
      {} as TRecordClass,
    );
  }

  protected findEquivalentInList(
    originalRecord: TRecordClass,
    list: TRecordClass[],
  ): TRecordClass | null {
    return (
      list.find((listItem) =>
        this.instance.isSameRecord(listItem, originalRecord),
      ) ?? null
    );
  }

  protected calculateKeyChange(
    recordA: TRecordClass,
    recordB: TRecordClass,
  ): KeyChange | null {
    const primaryKeyName = this.instance.getPrimaryKeyName();

    if (recordA[primaryKeyName] === recordB[primaryKeyName]) {
      return null;
    }

    return {
      keyBefore: recordA[primaryKeyName] as IndexableType,
      keyAfter: recordB[primaryKeyName] as IndexableType,
    };
  }

  protected async updateKeys(
    keyChanges: KeyChange[],
    primaryKeyName: string,
  ): Promise<void> {
    for (const { keyBefore, keyAfter } of keyChanges) {
      await this.instance.table.update(keyBefore, {
        [primaryKeyName]: keyAfter,
      });
    }
  }
}
