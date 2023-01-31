import { BulkSync } from "../src/BulkSync";
import { BookTable } from "./helpers/BookTable";
import { TestDatabase } from "./helpers/TestDatabase";

describe("exceptions", () => {
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

  it("passed a non-array argument", async () => {
    await expect(
      db.books
        .where({ genre_id: 1 })
        .bulkSync({ title: "Book 6", genre_id: 1 } as any),
    ).rejects.toThrowError(
      "'bulkSync' requires an array of items. Did you mean to use 'put'?",
    );
  });

  it("passed a non-array argument (standalone)", async () => {
    await expect(
      new BulkSync(db.books).execute([], {
        title: "Book 6",
        genre_id: 1,
      } as any),
    ).rejects.toThrowError(
      "'bulkSync' requires an array of items. Did you mean to use 'put'?",
    );
  });

  it("didn't pass any argument", async () => {
    await expect(
      db.books
        .where({ genre_id: 1 })
        .bulkSync(undefined as any),
    ).rejects.toThrowError(
      "'bulkSync' requires an array of items. Did you mean to use 'put'?",
    );
  });
});
