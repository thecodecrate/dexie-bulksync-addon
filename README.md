# BulkSync for Dexie

[![CI Tests](https://github.com/thecodecrate/dexie-bulksync-addon/actions/workflows/tests.yml/badge.svg)](https://github.com/thecodecrate/dexie-bulksync-addon/actions/workflows/tests.yml)
[![npm version](https://badge.fury.io/js/dexie-bulksync-addon.svg)](https://www.npmjs.com/package/dexie-bulksync-addon)

BulkSync is an addon for the Dexie library. It adds a `bulkSync` method to synchronize two datasets.

You can think of it as an extended version of the "bulkPut" command that also deletes records besides updating and adding records.

## Features
- **Add:** Automatically adds new records not present in the local database.
- **Delete:** Automatically deletes records not present in the new dataset.
- **Update:** Automatically updates records that are present in both the local database and the new dataset.
- **Smart update**: It only runs the database update command if the values are different, avoiding unnecessary disk writes and potential deadlocks.

## Installation
To install BulkSync for Dexie, you can use either yarn or npm.

```bash
# using yarn
yarn add dexie-bulksync-addon
```

```bash
# using npm
npm install dexie-bulksync-addon
```

After you have installed the package, you can apply the addon to your Dexie database by importing it and adding it to the `addons` array in the constructor.

```typescript
// db.ts
import Dexie, { Table } from "dexie";
import { BulkSyncAddon } from "dexie-bulksync-addon";

interface Book {
  id: number;
  title: string;
  genre_id: number;
}

class MyDatabase extends Dexie {
  public books!: Table<Book, number>;

  public constructor() {
    // LOOK HERE: applying the addon
    super("myDatabase", { addons: [BulkSyncAddon] });

    this.version(1).stores({
      books: '++id, title, genre_id'
    });
  }
}

const db = new MyDatabase();

export db;
```

## Usage
Here's an example of how you can use the `bulkSync` method to replace all records in the "books" table with a specific `genre_id`:

```typescript
// Let's assume this "books" table has already been populated with data
await db.books.bulkAdd([
  { id: 1, title: 'LOTR', genre_id: 1 },
  { id: 2, title: 'The Chronicles of Narnia', genre_id: 1 },
  { id: 3, title: 'The Great Gatsby', genre_id: 2 },
]);

// Now, we replace the "genre_id" 1 records
await db.books.where({ genre_id: 1 }).bulkSync([
  { id: 1, title: 'The Lord of the Rings', genre_id: 1 }, // update title
  { title: 'The Catcher in the Rye', genre_id: 1 }, // add record without primary key
  { id: 5, title: 'To Kill a Mockingbird', genre_id: 1 }, // add record with primary key
  // delete "The Chronicles of Narnia"
]);

// This operation is equivalent to removing all records with "genre_id" 1 and add the new dataset.
```

## Using with arrays
It's possible to use the `bulkSync` method with arrays. To do this, instantiate BulkSync and call `bulkSync.execute(currentDataset, newDataset)`:

```typescript
const currentDataSet = await db.books.where({ genre_id: 1 }).toArray();

await new BulkSync(db.books).execute(currentDataSet, newDataSet);
```

## Using with tables

You can call `bulkSync` in a collection a table:

```typescript
// table: it replaces all table records
await db.books.bulkSync(newDataSet);

// collection: replaces the selected records
await db.books.where({ genre_id: 1 }).bulkSync(newDataSet);
```

# Extending BulkSync
You can customize the behavior of bulkSync to suit your specific use case better. The BulkSync library allows you to do this by extending the BulkSync class.

Here's an example of how you can create a custom BulkSync class:

```typescript
// MyBulkSync.ts
import { BulkSync } from "dexie-bulksync-addon";

class MyBulkSync extends BulkSync {
  // Custom behavior can be implemented here
  // See the "API" section to see what you can do
}
```

Once you have defined your custom class, you can use it in your Dexie database by setting it to the `bulkSyncClass` property in the constructor.

```typescript
// db.ts
import Dexie from "dexie";
import { BulkSyncAddon } from "dexie-bulksync-addon";
import { MyBulkSync } from "./MyBulkSync";

class MyDatabase extends Dexie {
  public books!: Table<Book, number>;

  public constructor() {
    super("myDatabase", { addons: [BulkSyncAddon] });

    // LOOK HERE: Set the custom class
    this.bulkSyncClass = MyBulkSync;

    this.version(1).stores({
        books: '++id, title, genre_id'
    });
  }
}

const db = new MyDatabase();

export db;
```

In this example, you can see that the custom `MyBulkSync` class is imported and set as the `bulkSyncClass` property in the constructor of the `MyDatabase` class. The `bulkSync` method will use the custom behavior defined in the `MyBulkSync` class when called on any table in the `MyDatabase` class.

## Extending BulkSync per-table
It's also possible to extend the BulkSync class for specific tables rather than the entire database. You can create a custom class and assign it to the `db.bulkSyncInstances` property, specifying the table name as the key and the custom class as the value.

```typescript
// BookBulkSync.ts
import { BulkSync } from "dexie-bulksync-addon";

class BookBulkSync extends BulkSync<Book> {
  // Custom behavior can be implemented here
}
```

Then, you can set the class to a table with `db.bulkSyncInstances`:

```typescript
// db.ts
import Dexie from "dexie";
import { BulkSyncAddon } from "dexie-bulksync-addon";
import { MyBulkSync } from "./MyBulkSync";
import { BookBulkSync } from "./BookBulkSync";

class MyDatabase extends Dexie {
  public books!: Table<Book, number>;

  public constructor() {
    super("myDatabase", { addons: [BulkSyncAddon] });

    // LOOK HERE: Set an instance to the "books" table.
    this.bulkSyncInstances = {
      books: new BookBulkSync(db.books)
    }

    this.version(1).stores({
      books: '++id, title, genre_id'
    });
  }
}

const db = new MyDatabase();
```

# API

## Comparing records
By default, BulkSync uses the primary key of the records to determine if two records are the same. However, in certain cases, such as when using composite keys in pivot tables, you may want to use different fields to determine record equality.

You can customize the fields used for record comparison by defining the `fieldsIsSameRecord` property in a custom BulkSync class. This property should be set to an array of strings representing the field names used to compare records.

```typescript
// BookUserBulkSync.ts
import { BulkSync } from "dexie-bulksync-addon";

class BookUserBulkSync extends BulkSync<BookUser> {
  public fieldsIsSameRecord = ["book_id", "user_id"];
}
```

Alternatively, you can use the `getFieldsIsSameRecord()` method instead, which should return an array of field names. This allows you to generate the field names dynamically.

```typescript
// BookUserBulkSync.ts
import { BulkSync } from "dexie-bulksync-addon";

class BookUserBulkSync extends BulkSync<BookUser> {
  public getFieldsIsSameRecord(): Array<keyof TRecordClass> {
    return ["book_id", "user_id"];
  }
}
```

## Smart updates
By default, BulkSync only updates records in the local database if the contents of the new record are different from the contents of the existing record. To determine if the record's contents have changed, BulkSync compares every field in the record.

You can customize the fields that are used for this comparison by defining the `fieldsDataChanged` property in a custom BulkSync class. This property should be set to an array of strings representing the field names that should be used to compare records.

```typescript
// Book.ts
import { BulkSync } from "dexie-bulksync-addon";

class Book extends BulkSync<Book> {
  public fieldsDataChanged = ["title"];
}
```

Alternatively, you can use the `getFieldsDataChanged()` method instead, which should return an array of field names. This allows you to generate the field names dynamically.

```typescript
// BookBulkSync.ts
import { BulkSync } from "dexie-bulksync-addon";

class BookBulkSync extends BulkSync<Book> {
  public getFieldsDataChanged(): Array<keyof TRecordClass> {
    return ["title"];
  }
}
```

**Note:** Setting the `fieldsDataChanged` property to `null` will use all fields.

## Skipping fields on update
By default, BulkSync updates all fields of a record when performing an update operation. However, you may want to skip certain fields during this process.

You can customize the fields that are updated during an update operation by defining the `fieldsToUpdate` property in a custom BulkSync class. This property should be set to an array of strings representing the field names that should be updated.

```typescript
// BookBulkSync.ts
import { BulkSync } from "dexie-bulksync-addon";

class BookBulkSync extends BulkSync<Book> {
  public fieldsToUpdate = ["updated_at"];
}
```

Alternatively, you can use the `getFieldsToUpdate()` method instead, which should return an array of field names. This allows you to generate the field names dynamically.

```typescript
// BookBulkSync.ts
import { BulkSync } from "dexie-bulksync-addon";

class BookBulkSync extends BulkSync<Book> {
  public getFieldsToUpdate(): Array<keyof TRecordClass> {
    return ["updated_at"];
  }
}
```

**Note:** Setting the `fieldsToUpdate` property to `null` will update all fields during an update operation.

## Middlewares

Each call to BulkSync executes three actions: adding new records, deleting existing records, and updating existing records. You can create and use "middlewares" to add new actions or modify existing ones.

A middleware is a class that implements the `handle()` method, which BulkSync calls during its execution. You can use this method to perform additional actions or to customize the behavior of BulkSync.

```typescript
// LogMiddleware.ts
import { Middleware, Request } from "dexie-bulksync-addon";

export class LogMiddleware extends Middleware {
  public async handle(request: Request) {
    console.log(`BulkSync called on table "${this.instance.table.name}"`);
  }
}
```

Then, you can add the middleware to the `middlewares` property of your custom BulkSync class.

```typescript
// MyBulkSync.ts
import { BulkSync, Middleware } from "dexie-bulksync-addon";
import { AddMiddleware, DeleteMiddleware, UpdateMiddleware } from "dexie-bulksync-addon";
import { LogMiddleware } from "./LogMiddleware";

class MyBulkSync extends BulkSync {
  public middlewares: Middleware[] = [
    new LogMiddleware(this),
    new AddMiddleware(this),
    new DeleteMiddleware(this),
    new UpdateMiddleware(this),
  ];
}
```

You can use multiple middlewares and order them as per your requirements.

## Overriding via `BulkSyncSettings`

Instead of extending the BulkSync class, you can change the BulkSync behavior via a `BulkSyncSettings` object passed as a second argument to a `bulkSync` call.

It supports these properties:
- `fieldsIsSameRecord`
- `fieldsDataChanged`
- `fieldsToUpdate`
- `middlewares`

Example:

```typescript
const overriddenSettings = new BulkSyncSettings({
  fieldsToUpdate: ["updated_at"],
});

await db.books
  .where({ genre_id: 1 })
  .bulkSync(myUpdatedData, overriddenSettings);
```

## Conclusion
BulkSync for Dexie makes it easy to keep your local IndexedDB data in sync with a remote dataset. Its smart update operation ensures that your database remains efficient, while its simple API makes it easy to integrate into your web application.