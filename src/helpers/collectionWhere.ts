import { Collection } from "dexie";

function filterObject(
  object: Record<string, any>,
  whereClause: Record<string, any>,
): boolean {
  return Object.entries(whereClause).every(
    ([key, value]) => object[key] === value,
  );
}

export function collectionWhere(
  collection: Collection,
  whereClause: Record<string, any>,
): Collection {
  return collection.filter((item) => filterObject(item, whereClause));
}
