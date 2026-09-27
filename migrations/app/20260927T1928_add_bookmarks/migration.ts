#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/ae815f12fdb9e5218982eaaab170c7cf71b67f1dfdb80a6cab9a38d92944f62c/contract';
import endContract from '../../snapshots/ae815f12fdb9e5218982eaaab170c7cf71b67f1dfdb80a6cab9a38d92944f62c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/de7be13a939123bf13927b3b51b7dae483f01501faa24dfcbc79498593640900/contract';
import startContract from '../../snapshots/de7be13a939123bf13927b3b51b7dae483f01501faa24dfcbc79498593640900/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'bookmark',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('starRating', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('targetId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('targetType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'bookmark_pkey' }),
          checkExpression('bookmark_starRating_check', '("starRating" >= 0 AND "starRating" <= 5)'),
          checkExpression(
            'bookmark_targetType_check',
            "(\"targetType\" = ANY (ARRAY['CHAPTER'::text, 'LESSON'::text, 'CONCEPT'::text, 'EXECUTION'::text, 'CQ'::text, 'MCQ'::text]))",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'bookmarkCollection',
        columns: [
          col('color', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('defaultType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'bookmarkCollection_pkey' }),
          checkExpression(
            'bookmarkCollection_defaultType_check',
            '((type = \'DEFAULT\'::text AND "defaultType" IS NOT NULL) OR (type = \'CUSTOM\'::text AND "defaultType" IS NULL))',
          ),
          checkExpression(
            'bookmarkCollection_type_check',
            "(type = ANY (ARRAY['DEFAULT'::text, 'CUSTOM'::text]))",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'bookmarkCollectionItem',
        columns: [
          col('bookmarkId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('collectionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'bookmarkCollectionItem_pkey' })],
      }),
      this.addUnique({
        schema: 'public',
        table: 'bookmark',
        constraint: 'bookmark_userId_targetType_targetId_key',
        columns: ['userId', 'targetType', 'targetId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'bookmarkCollection',
        constraint: 'bookmarkCollection_userId_defaultType_key',
        columns: ['userId', 'defaultType'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'bookmarkCollectionItem',
        constraint: 'bookmarkCollectionItem_bookmarkId_collectionId_key',
        columns: ['bookmarkId', 'collectionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'bookmark',
        index: 'bookmark_targetType_targetId_idx_7a5ee9cb',
        columns: ['targetType', 'targetId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'bookmark',
        index: 'bookmark_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'bookmark',
        index: 'bookmark_userId_updatedAt_idx_42f5280d',
        columns: ['userId', 'updatedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'bookmarkCollection',
        index: 'bookmarkCollection_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'bookmarkCollection',
        index: 'bookmarkCollection_userId_sortOrder_idx_174a06c9',
        columns: ['userId', 'sortOrder'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'bookmarkCollectionItem',
        index: 'bookmarkCollectionItem_bookmarkId_idx_1962ac1f',
        columns: ['bookmarkId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'bookmarkCollectionItem',
        index: 'bookmarkCollectionItem_collectionId_idx_b344fc1a',
        columns: ['collectionId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'bookmark',
        foreignKey: {
          name: 'bookmark_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'bookmarkCollection',
        foreignKey: {
          name: 'bookmarkCollection_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'bookmarkCollectionItem',
        foreignKey: {
          name: 'bookmarkCollectionItem_bookmarkId_fkey',
          columns: ['bookmarkId'],
          references: { schema: 'public', table: 'bookmark', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'bookmarkCollectionItem',
        foreignKey: {
          name: 'bookmarkCollectionItem_collectionId_fkey',
          columns: ['collectionId'],
          references: { schema: 'public', table: 'bookmarkCollection', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
