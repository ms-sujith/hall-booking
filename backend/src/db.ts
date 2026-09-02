import postgres from "@prisma/orm-postgres/runtime";

import type { Contract } from "../prisma/contract";
import contractJson from "../prisma/contract.json" with { type: "json" };

import { env } from "./config/env";

export const db = postgres<Contract>({
  contractJson,
  url: env.DATABASE_URL,
});
