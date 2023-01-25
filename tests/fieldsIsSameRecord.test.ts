import { BulkSync } from "../src/BulkSync";
import { BookTable } from "./helpers/BookTable";
import { TestDatabase } from "./helpers/TestDatabase";

describe("Comparing records: 'BulkSync.fieldsIsSameRecord'", () => {
  const db = new TestDatabase();

  db.bulkSyncInstances["books"] = new (class extends BulkSync<BookTable> {
    public fieldsIsSameRecord = ["isbn", "genre_id"];
  })(db.books);

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

  it("keeps everything untouched", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" }, // untouched
      { id: 2, title: "Book 2", genre_id: 1, isbn: "b2" }, // untouched
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" }, // untouched
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "b2" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "b3" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" },
    ]);

    expect(db.mutatedKeys).toEqual([]);
  });

  it("keeps everything untouched without using primary key", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { title: "Book 1", genre_id: 1, isbn: "b1" }, // untouched
      { title: "Book 2", genre_id: 1, isbn: "b2" }, // untouched
      { title: "Book 4", genre_id: 1, isbn: "b4" }, // untouched
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "b2" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "b3" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" },
    ]);

    expect(db.mutatedKeys).toEqual([]);
  });

  it("adds records without a primary key", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" }, // untouched
      { id: 2, title: "Book 2", genre_id: 1, isbn: "b2" }, // untouched
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" }, // untouched
      { title: "Book 5", genre_id: 1, isbn: "b5" }, // add as "id 5"
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "b2" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "b3" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" },
      { id: 5, title: "Book 5", genre_id: 1, isbn: "b5" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: null, action: "added" },
    ]);
  });

  it("updates record using 'isbn + genre_id' as comparing fields", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { title: "Book 1", genre_id: 1, isbn: "b1" }, // untouched
      { title: "Book 2-changed", genre_id: 1, isbn: "b2" }, // update title
      { title: "Book 4", genre_id: 1, isbn: "b4" }, // untouched
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" },
      { id: 2, title: "Book 2-changed", genre_id: 1, isbn: "b2" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "b3" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 2, action: "updated" },
    ]);
  });

  it("changes isbn, causing record to be deleted/added instead of updated", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { title: "Book 1", genre_id: 1, isbn: "b1" }, // untouched
      { title: "Book 2", genre_id: 1, isbn: "b2-changed" }, // re-add as "id 5"
      { title: "Book 4", genre_id: 1, isbn: "b4" }, // untouched
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "b3" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" },
      { id: 5, title: "Book 2", genre_id: 1, isbn: "b2-changed" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 2, action: "deleted" },
      { table: "books", key: null, action: "added" },
    ]);
  });

  it("delete record using 'isbn + genre_id' as comparing fields", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { title: "Book 1", genre_id: 1, isbn: "b1" }, // untouched
      { title: "Book 4", genre_id: 1, isbn: "b4" }, // untouched
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "b3" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 2, action: "deleted" },
    ]);
  });

  it("updates primary key", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { title: "Book 1", genre_id: 1, isbn: "b1" }, // untouched
      { id: 100, title: "Book 2", genre_id: 1, isbn: "b2" }, // update id
      { title: "Book 4", genre_id: 1, isbn: "b4" }, // untouched
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "b1" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "b3" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" },
      { id: 100, title: "Book 2", genre_id: 1, isbn: "b2" },
    ]);

    // Note: IndexedDB does not support updating primary key, so Dexie will delete and add instead.
    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 100, action: "added" },
      { table: "books", key: 2, action: "deleted" },
      { table: "books", key: 100, action: "updated" },
    ]);
  });

  it("execute all operations at once - add, delete, update, keep", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1-changed", genre_id: 1, isbn: "b1" }, // update title
      // delete "id 2"
      { id: 4, title: "Book 4", genre_id: 1, isbn: "b4" }, // untouched
      { title: "Book 5", genre_id: 1, isbn: "b5" }, // add as "id 5"
      { id: 6, title: "Book 6", genre_id: 1, isbn: "b6" }, // add
    ]);

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
  });
});
