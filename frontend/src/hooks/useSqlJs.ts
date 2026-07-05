import type { Database, SqlJsStatic } from "sql.js";
import { useEffect, useState, useCallback } from "react";

export type QueryResult = {
  columns: string[];
  rows: Record<string, string>[];
};

export function useSqlJs(ddl: string, seedData: string) {
  const [db, setDb] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ddl) return;
    setLoading(true);
    setError(null);

    const initDb = async () => {
      try {
        const sqlJs = await (window as any).initSqlJs({
          locateFile: () =>
            `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.wasm`,
        });
        const database = new sqlJs.Database();
        database.run(ddl);
        if (seedData) database.run(seedData);
        setDb(database);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    initDb();

    return () => {
      setDb((prev) => {
        prev?.close();
        return null;
      });
    };
  }, [ddl, seedData]);

  const execute = useCallback(
    (sql: string): QueryResult => {
      if (!db) throw new Error("DBが初期化されていません");
      const results = db.exec(sql);
      if (results.length === 0) return { columns: [], rows: [] };
      const { columns, values } = results[0];
      const rows = values.map((row) =>
        Object.fromEntries(
          columns.map((col, i) => [col, String(row[i] ?? "")])
        )
      );
      return { columns, rows };
    },
    [db]
  );

  return { db, loading, error, execute };
}
