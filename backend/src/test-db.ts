import "temporal-polyfill/global";
import { db } from "./db";

async function testDatabase() {
  try {
    const users = await db.orm.public.User.all();

    console.log("Users fetched successfully!");
    console.log("Users:", users);
  } catch (error) {
    console.error("Database query failed:", error);
  }
}

testDatabase();