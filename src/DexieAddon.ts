import { Dexie, Table } from "dexie";
import { BulkSync } from "./BulkSync.js";
import { BulkSyncSettings } from "./BulkSyncSettings.js";
import { SingleSync } from "./SingleSync.js";

declare module "dexie" {
  interface Collection<T = any, TKey = IndexableType> {
    _ctx: {
      table: Table<T>;
    };

    bulkSync(
      newRecords: T[],
      overrideSettings?: BulkSyncSettings<T>,
    ): Promise<void>;

    singleSync(
      newRecord: T,
      overrideSettings?: BulkSyncSettings<T>,
    ): Promise<void>;
  }

  interface Table<T> {
    bulkSync(
      newRecords: T[],
      overrideSettings?: BulkSyncSettings<T>,
    ): Promise<void>;

    singleSync(
      newRecord: T,
      overrideSettings?: BulkSyncSettings<T>,
    ): Promise<void>;
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

function registerBulkSyncToCollection(db: Dexie) {
  db.Collection.prototype.bulkSync = async function <T>(
    newRecords: T[],
    overrideSettings?: BulkSyncSettings<T>,
  ) {
    const instance = singletonBulkSync<T>(db, this._ctx.table);

    await instance.execute(await this.toArray(), newRecords, overrideSettings);
  };
}

function registerBulkSyncToTable(db: Dexie) {
  db.Table.prototype.bulkSync = async function <T>(
    newRecords: T[],
    overrideSettings?: BulkSyncSettings<T>,
  ) {
    const instance = singletonBulkSync<T>(db, this);

    await instance.execute(await this.toArray(), newRecords, overrideSettings);
  };
}

function registerSingleSyncToCollection(db: Dexie) {
  db.Collection.prototype.singleSync = async function <T>(
    newRecord: T,
    overrideSettings?: BulkSyncSettings<T>,
  ) {
    const instance = singletonBulkSync<T>(db, this._ctx.table);

    const singleSync = new SingleSync<T>(instance);

    await singleSync.executeOnCollection(this, newRecord, overrideSettings);
  };
}

function registerSingleSyncToTable(db: Dexie) {
  db.Table.prototype.singleSync = async function <T>(
    newRecord: T,
    overrideSettings?: BulkSyncSettings<T>,
  ) {
    const instance = singletonBulkSync<T>(db, this);

    const singleSync = new SingleSync<T>(instance);

    await singleSync.executeOnTable(newRecord, overrideSettings);
  };
}

export function BulkSyncAddon(db: Dexie) {
  db.bulkSyncClass = BulkSync;

  db.bulkSyncInstances = {};

  registerBulkSyncToCollection(db);

  registerBulkSyncToTable(db);

  registerSingleSyncToCollection(db);

  registerSingleSyncToTable(db);
}
