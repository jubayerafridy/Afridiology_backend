#!/usr/bin/env -S node

import type { Contract as Start } from "../../snapshots/19d171ff260dfed096e346e4e435fabbfe2f7e6938b84c16e8841c94b3ec15cd/contract";
import startContract from "../../snapshots/19d171ff260dfed096e346e4e435fabbfe2f7e6938b84c16e8841c94b3ec15cd/contract.json" with { type: "json" };

import type { Contract as End } from "../../snapshots/4ce825e3cd5eb77665e8594f0026242ab28668d40eee2e0cbae37c4e86bf9360/contract";
import endContract from "../../snapshots/4ce825e3cd5eb77665e8594f0026242ab28668d40eee2e0cbae37c4e86bf9360/contract.json" with { type: "json" };

import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [];
  }
}

MigrationCLI.run(import.meta.url, M);
