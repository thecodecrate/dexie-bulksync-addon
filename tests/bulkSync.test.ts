import { BulkSync } from "../src/BulkSync";
import { BookTable } from "./helpers/BookTable";
import { TestDatabase } from "./helpers/TestDatabase";

describe("'bulkSync()' method", () => {
  const db = new TestDatabase();

  beforeEach(async () => {
    await db.resetAndSeed({
      books: [
        { id: 1, title: "Book 1", genre_id: 1 },
        { id: 2, title: "Book 2", genre_id: 1 },
        { id: 3, title: "Book 3", genre_id: 2 },
        { id: 4, title: "Book 4", genre_id: 1 },
      ],
    });
  });

  it("adds records without a primary key", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1", genre_id: 1 }, // untouched
      { id: 2, title: "Book 2", genre_id: 1 }, // untouched
      { id: 4, title: "Book 4", genre_id: 1 }, // untouched
      { title: "Book 5", genre_id: 1 }, // add as "id 5"
      { title: "Book 6", genre_id: 1 }, // add as "id 6"
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1 },
      { id: 2, title: "Book 2", genre_id: 1 },
      { id: 3, title: "Book 3", genre_id: 2 },
      { id: 4, title: "Book 4", genre_id: 1 },
      { id: 5, title: "Book 5", genre_id: 1 },
      { id: 6, title: "Book 6", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: null, action: "added" },
      { table: "books", key: null, action: "added" },
    ]);
  });

  it("adds records with a primary key", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1", genre_id: 1 }, // untouched
      { id: 2, title: "Book 2", genre_id: 1 }, // untouched
      { id: 4, title: "Book 4", genre_id: 1 }, // untouched
      { id: 10, title: "Book 10", genre_id: 1 }, // add
      { id: 20, title: "Book 20", genre_id: 1 }, // add
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1 },
      { id: 2, title: "Book 2", genre_id: 1 },
      { id: 3, title: "Book 3", genre_id: 2 },
      { id: 4, title: "Book 4", genre_id: 1 },
      { id: 10, title: "Book 10", genre_id: 1 },
      { id: 20, title: "Book 20", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 10, action: "added" },
      { table: "books", key: 20, action: "added" },
    ]);
  });

  it("adds records with primary keys that are number and string", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1", genre_id: 1 }, // untouched
      { id: 2, title: "Book 2", genre_id: 1 }, // untouched
      { id: 4, title: "Book 4", genre_id: 1 }, // untouched
      { id: "10", title: "Book 10", genre_id: 1 }, // add
      { id: "20a", title: "Book 20a", genre_id: 1 }, // add
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1 },
      { id: 2, title: "Book 2", genre_id: 1 },
      { id: 3, title: "Book 3", genre_id: 2 },
      { id: 4, title: "Book 4", genre_id: 1 },
      { id: "10", title: "Book 10", genre_id: 1 },
      { id: "20a", title: "Book 20a", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: "10", action: "added" },
      { table: "books", key: "20a", action: "added" },
    ]);
  });

  it("adds records with and without a primary key", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1", genre_id: 1 }, // untouched
      { id: 2, title: "Book 2", genre_id: 1 }, // untouched
      { id: 4, title: "Book 4", genre_id: 1 }, // untouched
      { title: "Book 5", genre_id: 1 }, // add as "id 5"
      { id: 10, title: "Book 10", genre_id: 1 }, // add
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1 },
      { id: 2, title: "Book 2", genre_id: 1 },
      { id: 3, title: "Book 3", genre_id: 2 },
      { id: 4, title: "Book 4", genre_id: 1 },
      { id: 5, title: "Book 5", genre_id: 1 },
      { id: 10, title: "Book 10", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: null, action: "added" },
      { table: "books", key: 10, action: "added" },
    ]);
  });

  it("delete records that are not in the collection", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1", genre_id: 1 }, // untouched
      // delete "id 2"
      // delete "id 4"
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1 },
      { id: 3, title: "Book 3", genre_id: 2 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 2, action: "deleted" },
      { table: "books", key: 4, action: "deleted" },
    ]);
  });

  it("update records that are in the collection", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1-changed", genre_id: 1 }, // update title
      { id: 2, title: "Book 2", genre_id: 1 }, // untouched
      { id: 4, title: "Book 4", genre_id: 1 }, // untouched
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1-changed", genre_id: 1 },
      { id: 2, title: "Book 2", genre_id: 1 },
      { id: 3, title: "Book 3", genre_id: 2 },
      { id: 4, title: "Book 4", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 1, action: "updated" },
    ]);
  });

  it("keep records untouched", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1-changed", genre_id: 1 }, // update title
      { id: 2, title: "Book 2", genre_id: 1 }, // untouched
      { id: 4, title: "Book 4-changed", genre_id: 1 }, // update title
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1-changed", genre_id: 1 },
      { id: 2, title: "Book 2", genre_id: 1 },
      { id: 3, title: "Book 3", genre_id: 2 },
      { id: 4, title: "Book 4-changed", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 1, action: "updated" },
      { table: "books", key: 4, action: "updated" },
    ]);
  });

  it("doesn't consider number and string primary keys as the same", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: "1", title: "Book 1", genre_id: 1 }, // delete and re-add
      { id: "2", title: "Book 2", genre_id: 1 }, // delete and re-add
      { id: 4, title: "Book 4", genre_id: 1 }, // untouched
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 3, title: "Book 3", genre_id: 2 },
      { id: 4, title: "Book 4", genre_id: 1 },
      { id: "1", title: "Book 1", genre_id: 1 },
      { id: "2", title: "Book 2", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 1, action: "deleted" },
      { table: "books", key: 2, action: "deleted" },
      { table: "books", key: "1", action: "added" },
      { table: "books", key: "2", action: "added" },
    ]);
  });

  it("execute all operations at once - add, delete, update, keep", async () => {
    await db.books.where({ genre_id: 1 }).bulkSync([
      { id: 1, title: "Book 1-changed", genre_id: 1 }, // update title
      // delete "id 2"
      { id: 4, title: "Book 4", genre_id: 1 }, // untouched
      { title: "Book 5", genre_id: 1 }, // add as "id 5"
      { id: 6, title: "Book 6", genre_id: 1 }, // add
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1-changed", genre_id: 1 },
      { id: 3, title: "Book 3", genre_id: 2 },
      { id: 4, title: "Book 4", genre_id: 1 },
      { id: 5, title: "Book 5", genre_id: 1 },
      { id: 6, title: "Book 6", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 2, action: "deleted" },
      { table: "books", key: null, action: "added" },
      { table: "books", key: 6, action: "added" },
      { table: "books", key: 1, action: "updated" },
    ]);
  });

  it("works with arrays", async () => {
    const currentDataSet = await db.books.where({ genre_id: 1 }).toArray();

    await new BulkSync(db.books).execute(currentDataSet, [
      { id: 1, title: "Book 1-changed", genre_id: 1 }, // update title
      // delete "id 2"
      { id: 4, title: "Book 4", genre_id: 1 }, // untouched
      { title: "Book 5", genre_id: 1 }, // add as "id 5"
      { id: 6, title: "Book 6", genre_id: 1 }, // add
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1-changed", genre_id: 1 },
      { id: 3, title: "Book 3", genre_id: 2 },
      { id: 4, title: "Book 4", genre_id: 1 },
      { id: 5, title: "Book 5", genre_id: 1 },
      { id: 6, title: "Book 6", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 2, action: "deleted" },
      { table: "books", key: null, action: "added" },
      { table: "books", key: 6, action: "added" },
      { table: "books", key: 1, action: "updated" },
    ]);
  });

  it("works with tables", async () => {
    await db.books.bulkSync([
      { id: 1, title: "Book 1-changed", genre_id: 1 }, // update title
      // delete "id 2"
      // delete "id 3" (notice bulkSync is being applyed to a table, not a collection)
      { id: 4, title: "Book 4", genre_id: 1 }, // untouched
      { title: "Book 5", genre_id: 1 }, // add as "id 5"
      { id: 6, title: "Book 6", genre_id: 1 }, // add
    ]);

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1-changed", genre_id: 1 },
      { id: 4, title: "Book 4", genre_id: 1 },
      { id: 5, title: "Book 5", genre_id: 1 },
      { id: 6, title: "Book 6", genre_id: 1 },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 2, action: "deleted" },
      { table: "books", key: 3, action: "deleted" },
      { table: "books", key: null, action: "added" },
      { table: "books", key: 6, action: "added" },
      { table: "books", key: 1, action: "updated" },
    ]);
  });
});
