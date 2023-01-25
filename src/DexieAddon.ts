import Dexie, { Table } from "dexie";
import { BulkSync } from "./BulkSync";

declare module "dexie" {
  interface Collection<T = any, TKey = IndexableType> {
    _ctx: {
      table: Table<T>;
    };

    bulkSync(newRecords: T[]): Promise<void>;
  }

  interface Table<T> {
    bulkSync(newRecords: T[]): Promise<void>;
  }

  interface Dexie {
    bulkSyncClass: typeof BulkSync<any>;

    bulkSyncInstances: {
      [key: string]: BulkSync<any>;
    };
  }
}

function singletonBulkSync<T>(db: Dexie, table: Table<T>): BulkSync<T> {
  let instance = db.bulkSyncInstances[table.name];

  if (!instance) {
    instance = new db.bulkSyncClass(table);

    db.bulkSyncInstances[table.name] = instance;
  }

  return instance;
}

export function BulkSyncAddon(db: Dexie) {
  db.bulkSyncClass = BulkSync;

  db.bulkSyncInstances = {};

  db.Collection.prototype.bulkSync = async function <T>(newRecords: T[]) {
    const instance = singletonBulkSync<T>(db, this._ctx.table);

    await instance.execute(await this.toArray(), newRecords);
  };

  db.Table.prototype.bulkSync = async function <T>(newRecords: T[]) {
    const instance = singletonBulkSync<T>(db, this);

    await instance.execute(await this.toArray(), newRecords);
  };
}
