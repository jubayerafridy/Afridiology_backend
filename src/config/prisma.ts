import postgres from "@prisma/orm-postgres/runtime";

import type { Contract } from "../../prisma/contract.d.ts";
import contractJson from "../../prisma/contract.json" with { type: "json" };

import { env } from "./env.js";

export const prisma = postgres<Contract>({
  contractJson,
  url: env.DATABASE_URL,
});
