import Dexie, { IndexableType, Table } from "dexie";
import { BulkSyncAddon } from "../../src/DexieAddon";
import { BookTable } from "./BookTable";

type TableAndRecords = { [key: string]: any[] };

type TableKey = { table: string; key: IndexableType };

type TableKeyAction = {
  table: string;
  key: IndexableType;
  action: "updated" | "deleted" | "added";
};

export class TestDatabase extends Dexie {
  public books!: Table<BookTable, number>;

  public updatedKeys: TableKey[] = [];
  public deletedKeys: TableKey[] = [];
  public addedKeys: TableKey[] = [];
  public mutatedKeys: TableKeyAction[] = [];

  public constructor() {
    super("testDatabase", { addons: [BulkSyncAddon] });

    this.version(1).stores({
      books: "++id, title, genre_id",
    });

    this.registerHooks(this.books);
  }

  protected registerHooks(table: Table) {
    this.registerOnAddHook(table);

    this.registerOnDeleteHook(table);

    this.registerOnUpdateHook(table);
  }

  protected registerOnAddHook(table: Table) {
    table.hook("creating", function (primKey, obj, transaction) {
      const db = transaction.db as TestDatabase;

      const entry: TableKey = { table: table.name, key: primKey ?? null };

      db.addedKeys.push(entry);

      db.mutatedKeys.push({ ...entry, action: "added" });
    });
  }

  protected registerOnDeleteHook(table: Table) {
    table.hook("deleting", function (primKey, obj, transaction) {
      const db = transaction.db as TestDatabase;

      const entry: TableKey = { table: table.name, key: primKey };

      db.deletedKeys.push(entry);

      db.mutatedKeys.push({ ...entry, action: "deleted" });
    });
  }

  protected registerOnUpdateHook(table: Table) {
    table.hook("updating", function (modifications, primKey, obj, transaction) {
      const db = transaction.db as TestDatabase;

      const entry: TableKey = { table: table.name, key: primKey };

      db.updatedKeys.push(entry);

      db.mutatedKeys.push({ ...entry, action: "updated" });

      return modifications;
    });
  }

  public resetCounters() {
    this.updatedKeys = [];
    this.deletedKeys = [];
    this.addedKeys = [];
    this.mutatedKeys = [];
  }

  public async resetData() {
    await this.delete();

    await this.open();
  }

  public async seed(tableAndRecords: TableAndRecords = {}) {
    const tablesNames = Object.keys(tableAndRecords);

    const tables: Table[] = tablesNames.map(
      (tableName) => this._allTables[tableName],
    );

    await this.transaction("rw", tables, async () => {
      for (const table of tables) {
        const tableName = table.name;

        const seedRecords = tableAndRecords[tableName];

        await this._allTables[tableName].bulkAdd(seedRecords);
      }
    });
  }

  public async resetAndSeed(tableAndRecords: TableAndRecords = {}) {
    await this.resetData();

    await this.seed(tableAndRecords);

    await this.resetCounters();
  }
}
