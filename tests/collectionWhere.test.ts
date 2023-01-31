import { BulkSync } from "../src/BulkSync";
import { collectionWhere } from "../src/helpers/collectionWhere";
import { BookTable } from "./helpers/BookTable";
import { TestDatabase } from "./helpers/TestDatabase";

describe("'collectionWhere()' method", () => {
  const db = new TestDatabase();

  beforeEach(async () => {
    await db.resetAndSeed({
      books: [
        { id: 1, title: "Book 1", genre_id: 1, author_id: 1 },
        { id: 2, title: "Book 2", genre_id: 1, author_id: 2 },
        { id: 3, title: "Book 3", genre_id: 2, author_id: 2 },
        { id: 4, title: "Book 4", genre_id: 1, author_id: 1 },
      ],
    });
  });

  it("filters collection records", async () => {
    const collection = await db.books.where({ genre_id: 1 });

    const filteredCollection = collectionWhere(collection, { author_id: 1 });

    const books = await filteredCollection.toArray();

    expect(books).toEqual([
      { id: 1, title: "Book 1", genre_id: 1, author_id: 1 },
      { id: 4, title: "Book 4", genre_id: 1, author_id: 1 },
    ]);
  });
});
