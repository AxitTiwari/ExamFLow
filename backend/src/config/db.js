import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'examflow',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

// Procedure names are fixed in route code; values are always parameterized.
export async function callProcedure(name, params = []) {
  const placeholders = params.map(() => '?').join(', ');
  const [resultSets] = await pool.query(`CALL ${name}(${placeholders})`, params);
  return resultSets;
}

export function firstRows(resultSets) {
  return Array.isArray(resultSets?.[0]) ? resultSets[0] : [];
}
export function firstRow(resultSets) {
  return firstRows(resultSets)[0] || null;
}
