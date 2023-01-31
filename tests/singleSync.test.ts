import { BookTable } from "./helpers/BookTable";
import { TestDatabase } from "./helpers/TestDatabase";
import Dexie from "dexie";

describe("'singleSync()' method", () => {
  const db = new TestDatabase();

  beforeEach(async () => {
    await db.resetAndSeed({
      books: [
        { id: 1, title: "Book 1", genre_id: 1, isbn: "aaa" },
        { id: 2, title: "Book 2", genre_id: 1, isbn: "bbb" },
        { id: 3, title: "Book 3", genre_id: 2, isbn: "ccc" },
        { id: 4, title: "Book 4", genre_id: 1, isbn: "ddd" },
      ],
    });
  });

  it("adds record without a primary key", async () => {
    await db.books.where({ genre_id: 1 }).singleSync(
      { title: "Book 5", genre_id: 1, isbn: "eee" }, // add as "id 5"
    );

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "aaa" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "bbb" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "ccc" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "ddd" },
      { id: 5, title: "Book 5", genre_id: 1, isbn: "eee" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: null, action: "added" },
    ]);
  });

  it("adds record with a numeric primary key", async () => {
    await db.books.where({ genre_id: 1 }).singleSync(
      { id: 10, title: "Book 10", genre_id: 1, isbn: "xxx" }, // add
    );

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "aaa" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "bbb" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "ccc" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "ddd" },
      { id: 10, title: "Book 10", genre_id: 1, isbn: "xxx" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 10, action: "added" },
    ]);
  });

  it("adds record with a string primary key", async () => {
    await db.books.where({ genre_id: 1 }).singleSync(
      { id: "20a", title: "Book 20a", genre_id: 1, isbn: "yyy" }, // add
    );

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "aaa" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "bbb" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "ccc" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "ddd" },
      { id: "20a", title: "Book 20a", genre_id: 1, isbn: "yyy" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: "20a", action: "added" },
    ]);
  });

  it("update record that is in the collection", async () => {
    await db.books.where({ genre_id: 1 }).singleSync(
      { id: 1, title: "Book 1-changed", genre_id: 1, isbn: "aaa" }, // update title
    );

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1-changed", genre_id: 1, isbn: "aaa" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "bbb" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "ccc" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "ddd" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 1, action: "updated" },
    ]);
  });

  it("tries to update title, but using wrong collection, it adds a new record, which is not allowed (duplicate pk)", async () => {
    try {
      await db.books
        .where({ genre_id: 2 })
        .singleSync({ id: 1, title: "Book 1", genre_id: 1 });
    } catch (e) {
      expect(e).toBeInstanceOf(Dexie.BulkError);
    }
  });

  it("keep records untouched", async () => {
    await db.books.where({ genre_id: 1 }).singleSync(
      { id: 2, title: "Book 2", genre_id: 1, isbn: "bbb" }, // untouched
    );

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "aaa" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "bbb" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "ccc" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "ddd" },
    ]);

    expect(db.mutatedKeys).toEqual([]);
  });

  it("doesn't consider number and string primary keys as the same", async () => {
    await db.books.where({ genre_id: 1 }).singleSync(
      { id: "1", title: "Book 1", genre_id: 1, isbn: "aaa" }, // re-add with string primary key
    );

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, isbn: "aaa" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "bbb" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "ccc" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "ddd" },
      { id: "1", title: "Book 1", genre_id: 1, isbn: "aaa" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: "1", action: "added" },
    ]);
  });

  it("works with tables", async () => {
    await db.books.singleSync(
      { id: 1, title: "Book 1-changed", genre_id: 1, isbn: "aaa" }, // update title
    );

    const books = await BookTable.FromCollection(db.books.orderBy("id"));

    expect(books).toEqual([
      { id: 1, title: "Book 1-changed", genre_id: 1, isbn: "aaa" },
      { id: 2, title: "Book 2", genre_id: 1, isbn: "bbb" },
      { id: 3, title: "Book 3", genre_id: 2, isbn: "ccc" },
      { id: 4, title: "Book 4", genre_id: 1, isbn: "ddd" },
    ]);

    expect(db.mutatedKeys).toEqual([
      { table: "books", key: 1, action: "updated" },
    ]);
  });
});
