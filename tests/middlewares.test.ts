import { BookTable } from "./helpers/BookTable";
import { LogBulkSync } from "./helpers/LogBulkSync";
import { TestDatabase } from "./helpers/TestDatabase";

describe("Middlewares: 'BulkSync.middlewares'", () => {
  const db = new TestDatabase();

  db.bulkSyncClass = LogBulkSync;

  beforeEach(async () => {
    await db.resetAndSeed({
      books: [
        { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" },
        { id: 2, title: "Book 2", genre_id: 1, isbn: "b2" },
        { id: 3, title: "Book 3", genre_id: 2, isbn: "b3" },
        { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" },
      ],
    });
  });

  it("works with a 'log' middleware", async () => {
    const currentCollection = db.books.where({ genre_id: 1 });

    const currentRecords = await currentCollection.toArray();

    const newRecords = [
      { id: 1, title: "Book 1-changed", genre_id: 1, isbn: "b1" }, // update title
      // delete "id 2"
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" }, // untouched
      { title: "Book 5", genre_id: 1, isbn: "b5" }, // add as "id 5"
      { id: 6, title: "Book 6", genre_id: 1, isbn: "b6" }, // add
    ];

    // run all operations: update, delete, add, keep
    await currentCollection.bulkSync(newRecords);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1-changed", genre_id: 1, isbn: "b1" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "b3" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" },
      { id: 5, title: "Book 5", genre_id: 1, isbn: "b5" },
      { id: 6, title: "Book 6", genre_id: 1, isbn: "b6" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 2, action: "deleted" },
      { table: "books", key: null, action: "added" },
      { table: "books", key: 6, action: "added" },
      { table: "books", key: 1, action: "updated" },
    ]);

    const logs = (db.bulkSyncInstances.books as LogBulkSync).getLogs();

    expect(logs.length).toBe(1);

    const logEntry = JSON.parse(logs[0]);

    expect(logEntry).toEqual({
      newRecords,
      currentRecords,
    });
  });
});
