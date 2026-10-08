#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/0fe598e734ec5892e8141b4cf5b01642f3577f183177cf621b253784d38f0863/contract";
import startContract from "../../snapshots/0fe598e734ec5892e8141b4cf5b01642f3577f183177cf621b253784d38f0863/contract.json" with { type: "json" };

import type { Contract as End } from "../../snapshots/19d171ff260dfed096e346e4e435fabbfe2f7e6938b84c16e8841c94b3ec15cd/contract";
import endContract from "../../snapshots/19d171ff260dfed096e346e4e435fabbfe2f7e6938b84c16e8841c94b3ec15cd/contract.json" with { type: "json" };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
} from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: "public",
        table: "cQ",
        column: col("point", "int4", {
          codecRef: { codecId: "pg/int4@1" },
        }),
      }),

      this.addColumn({
        schema: "public",
        table: "cQ",
        column: col("ytLink", "text", {
          codecRef: { codecId: "pg/text@1" },
        }),
      }),

      this.setDefault({
        schema: "public",
        table: "cQ",
        column: "isActive",
        defaultSql: "DEFAULT false",
        operationClass: "widening",
      }),

      this.dropNotNull({
        schema: "public",
        table: "cQ",
        column: "qusNo",
      }),

      this.dropNotNull({
        schema: "public",
        table: "cQ",
        column: "quesGhaBN",
      }),

      this.dropNotNull({
        schema: "public",
        table: "cQ",
        column: "quesGhaEng",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
