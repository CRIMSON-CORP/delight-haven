import { drizzle } from "drizzle-orm/postgres-js";
import postgress from "postgres";
import * as schema from "./schema";

export default drizzle(postgress(process.env.DATABASE_URL as string), {
  schema,
});
