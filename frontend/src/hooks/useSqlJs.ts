import { useEffect, useState, useCallback } from "react";
import initSqlJs from "sql.js";
import type { Database } from "sql.js";

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

    initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`,
    })
      .then((SQL) => {
        const database = new SQL.Database();
        database.run(ddl);
        if (seedData) database.run(seedData);
        setDb(database);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

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
        Object.fromEntries(columns.map((col, i) => [col, String(row[i] ?? "")]))
      );
      return { columns, rows };
    },
    [db]
  );

  return { db, loading, error, execute };
}
