import postgres from "postgres";

const sql = postgres({
  debug: true,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  publications: [process.env.DB_PUBNAME],
  port: process.env.DB_PORT,
  connect_timeout: 30,
  max: 20,
});

const testConn = await sql`SELECT CURRENT_TIMESTAMP`;

export default sql;
