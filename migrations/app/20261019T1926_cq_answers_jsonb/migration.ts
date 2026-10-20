import type { Contract as End } from "../../snapshots/3dfcd21bd3c5c1f0063677e7ba6622377169a6362c1c788a2576801fa70bfbc7/contract";
import endContract from "../../snapshots/3dfcd21bd3c5c1f0063677e7ba6622377169a6362c1c788a2576801fa70bfbc7/contract.json" with { type: "json" };
import type { Contract as Start } from "../../snapshots/ad2650510d1583c31df5cc9bfb2d5d8e01e2c358a47116b4e6f89583689f4b72/contract";
import startContract from "../../snapshots/ad2650510d1583c31df5cc9bfb2d5d8e01e2c358a47116b4e6f89583689f4b72/contract.json" with { type: "json" };
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.alterColumnType({
        schema: "public",
        table: "cQ",
        column: "ansKaBN",
        options: {
          qualifiedTargetType: "json",
          formatTypeExpected: "json",
          rawTargetTypeForLabel: "json",
        },
      }),
      this.alterColumnType({
        schema: "public",
        table: "cQ",
        column: "ansKaEng",
        options: {
          qualifiedTargetType: "json",
          formatTypeExpected: "json",
          rawTargetTypeForLabel: "json",
        },
      }),
      this.alterColumnType({
        schema: "public",
        table: "cQ",
        column: "ansKhaBN",
        options: {
          qualifiedTargetType: "json",
          formatTypeExpected: "json",
          rawTargetTypeForLabel: "json",
        },
      }),
      this.alterColumnType({
        schema: "public",
        table: "cQ",
        column: "ansKhaEng",
        options: {
          qualifiedTargetType: "json",
          formatTypeExpected: "json",
          rawTargetTypeForLabel: "json",
        },
      }),
      this.alterColumnType({
        schema: "public",
        table: "cQ",
        column: "ansGaBN",
        options: {
          qualifiedTargetType: "json",
          formatTypeExpected: "json",
          rawTargetTypeForLabel: "json",
        },
      }),
      this.alterColumnType({
        schema: "public",
        table: "cQ",
        column: "ansGaEng",
        options: {
          qualifiedTargetType: "json",
          formatTypeExpected: "json",
          rawTargetTypeForLabel: "json",
        },
      }),
      this.alterColumnType({
        schema: "public",
        table: "cQ",
        column: "ansGhaBN",
        options: {
          qualifiedTargetType: "json",
          formatTypeExpected: "json",
          rawTargetTypeForLabel: "json",
        },
      }),
      this.alterColumnType({
        schema: "public",
        table: "cQ",
        column: "ansGhaEng",
        options: {
          qualifiedTargetType: "json",
          formatTypeExpected: "json",
          rawTargetTypeForLabel: "json",
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
