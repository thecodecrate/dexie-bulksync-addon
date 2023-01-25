import { Collection } from "dexie";

export class BookTable {
  id?: number | string;
  title?: string;
  genre_id?: number;
  isbn?: string;

  static FromJson(json: any): BookTable {
    const book = new BookTable();

    book.id = json.id;
    book.title = json.title;
    book.genre_id = json.genre_id;
    book.isbn = json.isbn;

    return book;
  }

  static async FromCollection(collection: Collection): Promise<BookTable[]> {
    const books = await collection.toArray();

    return books.map((book) => BookTable.FromJson(book));
  }
}
