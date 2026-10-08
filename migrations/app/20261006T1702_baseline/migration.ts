#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/ad2650510d1583c31df5cc9bfb2d5d8e01e2c358a47116b4e6f89583689f4b72/contract';
import endContract from '../../snapshots/ad2650510d1583c31df5cc9bfb2d5d8e01e2c358a47116b4e6f89583689f4b72/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'authIdentity',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('provider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('providerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'authIdentity_pkey' }),
          checkExpression(
            'authIdentity_provider_check_ff14e296_5f9e855b',
            "(provider = ANY (ARRAY['GOOGLE'::text, 'FACEBOOK'::text]))",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'authSession',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('revokedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('tokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'authSession_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'bookmark',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('starRating', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('targetId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('targetType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'bookmark_pkey' }),
          checkExpression(
            'bookmark_starRating_range_guard_8576ec40',
            '(("starRating" >= 0) AND ("starRating" <= 5))',
          ),
          checkExpression(
            'bookmark_targetType_guard_7953d357',
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
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'bookmarkCollection_pkey' }),
          checkExpression(
            'bookmarkCollection_defaultType_guard_0a376a70',
            '(((type = \'DEFAULT\'::text) AND ("defaultType" IS NOT NULL)) OR ((type = \'CUSTOM\'::text) AND ("defaultType" IS NULL)))',
          ),
          checkExpression(
            'bookmarkCollection_type_guard_98acd6c4',
            "(type = ANY (ARRAY['DEFAULT'::text, 'CUSTOM'::text]))",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'bookmarkCollectionItem',
        columns: [
          col('bookmarkId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('collectionId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'bookmarkCollectionItem_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'cQ',
        columns: [
          col('ansGaBN', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ansGaEng', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ansGhaBN', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ansGhaEng', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ansKaBN', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ansKaEng', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ansKhaBN', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ansKhaEng', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('descriptionBN', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('descriptionEng', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('point', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('quesGaBN', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quesGaEng', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quesGaLinkId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesGaLinkType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesGhaBN', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesGhaEng', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesGhaLinkId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesGhaLinkType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesKaBN', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quesKaEng', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quesKaLinkId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesKaLinkType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesKhaBN', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quesKhaEng', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quesKhaLinkId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesKhaLinkType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quesUddipok', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('questionPaperId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('qusNo', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('ytLink', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'cQ_pkey' }),
          checkExpression(
            'cQ_quesGaLinkType_check_d4dcebe0_cdad55a5',
            "(\"quesGaLinkType\" = ANY (ARRAY['CHAPTER'::text, 'LESSON'::text, 'CONCEPT'::text, 'EXECUTION'::text]))",
          ),
          checkExpression(
            'cQ_quesGhaLinkType_check_4f0b21d6_530e4056',
            "(\"quesGhaLinkType\" = ANY (ARRAY['CHAPTER'::text, 'LESSON'::text, 'CONCEPT'::text, 'EXECUTION'::text]))",
          ),
          checkExpression(
            'cQ_quesKaLinkType_check_0020e8a5_8bdb540e',
            "(\"quesKaLinkType\" = ANY (ARRAY['CHAPTER'::text, 'LESSON'::text, 'CONCEPT'::text, 'EXECUTION'::text]))",
          ),
          checkExpression(
            'cQ_quesKhaLinkType_check_e93f81d1_ccde7833',
            "(\"quesKhaLinkType\" = ANY (ARRAY['CHAPTER'::text, 'LESSON'::text, 'CONCEPT'::text, 'EXECUTION'::text]))",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'chapter',
        columns: [
          col('chapterNo', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('descriptionBN', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('descriptionEng', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('nameBN', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nameEng', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('subjectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'chapter_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'concept',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('descriptionBN', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('descriptionEng', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('lessonId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nameBN', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nameEng', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'concept_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'educationLevel',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'educationLevel_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'execution',
        columns: [
          col('conceptId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('descriptionBN', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('descriptionEng', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('nameBN', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nameEng', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'execution_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'lesson',
        columns: [
          col('chapterId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('descriptionBN', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('descriptionEng', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('lessonNo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nameBN', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nameEng', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'lesson_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'mCQ',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('descriptionBN', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('descriptionEng', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('explanationBN', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('explanationEng', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('linkId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('linkType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('optionsBN', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('optionsEng', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('questionPaperId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('qusNo', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('rightAns', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('ytLink', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'mCQ_pkey' }),
          checkExpression(
            'mCQ_linkType_check_5f57da78_561ff9bd',
            "(\"linkType\" = ANY (ARRAY['CHAPTER'::text, 'LESSON'::text, 'CONCEPT'::text, 'EXECUTION'::text]))",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'questionPaper',
        columns: [
          col('board', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('class', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('institution', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('questionType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('source', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('subjectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('year', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'questionPaper_pkey' }),
          checkExpression(
            'questionPaper_questionType_check_fc2fe208_f1eadf48',
            "(\"questionType\" = ANY (ARRAY['CQ'::text, 'MCQ'::text]))",
          ),
          checkExpression(
            'questionPaper_source_check_4f230989_80787773',
            "(source = ANY (ARRAY['BOARD'::text, 'TEST_PAPER'::text, 'MODEL_TEST'::text, 'GAME'::text, 'QUIZ'::text, 'EXTRA'::text]))",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'questionProgress',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('targetId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('targetType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'questionProgress_pkey' }),
          checkExpression(
            'questionProgress_status_guard_31755cbe',
            "(status = ANY (ARRAY['NOT_STARTED'::text, 'IN_PROGRESS'::text, 'COMPLETED'::text]))",
          ),
          checkExpression(
            'questionProgress_targetType_guard_7953d357',
            "(\"targetType\" = ANY (ARRAY['CHAPTER'::text, 'LESSON'::text, 'CONCEPT'::text, 'EXECUTION'::text, 'CQ'::text, 'MCQ'::text]))",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'subject',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('educationLevelId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'subject_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('emailVerified', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('STUDENT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id'], { name: 'user_pkey' }),
          checkExpression(
            'user_role_check_2d5baec_2204808b',
            "(role = ANY (ARRAY['STUDENT'::text, 'TEACHER'::text, 'AUTHOR'::text, 'MODERATOR'::text, 'ADMIN'::text, 'SUPER_ADMIN'::text]))",
          ),
          checkExpression(
            'user_status_check_5dec1c59_87df64c6',
            "(status = ANY (ARRAY['ACTIVE'::text, 'SUSPENDED'::text, 'DEACTIVATED'::text]))",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'authIdentity',
        constraint: 'authIdentity_provider_providerId_key',
        columns: ['provider', 'providerId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'authSession',
        constraint: 'authSession_tokenHash_key',
        columns: ['tokenHash'],
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
      this.addUnique({
        schema: 'public',
        table: 'chapter',
        constraint: 'chapter_subjectId_chapterNo_key',
        columns: ['subjectId', 'chapterNo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'lesson',
        constraint: 'lesson_chapterId_lessonNo_key',
        columns: ['chapterId', 'lessonNo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'questionProgress',
        constraint: 'questionProgress_userId_targetType_targetId_key',
        columns: ['userId', 'targetType', 'targetId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'authIdentity',
        index: 'authIdentity_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'authSession',
        index: 'authSession_expiresAt_idx_6b6b8c10',
        columns: ['expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'authSession',
        index: 'authSession_userId_idx_a489d58a',
        columns: ['userId'],
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
      this.createIndex({
        schema: 'public',
        table: 'cQ',
        index: 'cQ_quesGaLinkType_quesGaLinkId_idx_561e4602',
        columns: ['quesGaLinkType', 'quesGaLinkId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cQ',
        index: 'cQ_quesGhaLinkType_quesGhaLinkId_idx_d75cc936',
        columns: ['quesGhaLinkType', 'quesGhaLinkId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cQ',
        index: 'cQ_quesKaLinkType_quesKaLinkId_idx_1153861a',
        columns: ['quesKaLinkType', 'quesKaLinkId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cQ',
        index: 'cQ_quesKhaLinkType_quesKhaLinkId_idx_e426f048',
        columns: ['quesKhaLinkType', 'quesKhaLinkId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cQ',
        index: 'cQ_questionPaperId_idx_b5131c3f',
        columns: ['questionPaperId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'chapter',
        index: 'chapter_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'concept',
        index: 'concept_lessonId_idx_e358970d',
        columns: ['lessonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'execution',
        index: 'execution_conceptId_idx_561d5276',
        columns: ['conceptId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lesson',
        index: 'lesson_chapterId_idx_411dd3d6',
        columns: ['chapterId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'mCQ',
        index: 'mCQ_linkType_linkId_idx_bf3c7c65',
        columns: ['linkType', 'linkId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'mCQ',
        index: 'mCQ_questionPaperId_idx_b5131c3f',
        columns: ['questionPaperId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'questionPaper',
        index: 'questionPaper_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'questionProgress',
        index: 'questionProgress_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'questionProgress',
        index: 'questionProgress_userId_updatedAt_idx_42f5280d',
        columns: ['userId', 'updatedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'subject',
        index: 'subject_educationLevelId_idx_c4962183',
        columns: ['educationLevelId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user',
        index: 'user_role_idx_2c1ddf83',
        columns: ['role'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user',
        index: 'user_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'authIdentity',
        foreignKey: {
          name: 'authIdentity_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'authSession',
        foreignKey: {
          name: 'authSession_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
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
      this.addForeignKey({
        schema: 'public',
        table: 'cQ',
        foreignKey: {
          name: 'cQ_questionPaperId_fkey',
          columns: ['questionPaperId'],
          references: { schema: 'public', table: 'questionPaper', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'chapter',
        foreignKey: {
          name: 'chapter_subjectId_fkey',
          columns: ['subjectId'],
          references: { schema: 'public', table: 'subject', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'concept',
        foreignKey: {
          name: 'concept_lessonId_fkey',
          columns: ['lessonId'],
          references: { schema: 'public', table: 'lesson', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'execution',
        foreignKey: {
          name: 'execution_conceptId_fkey',
          columns: ['conceptId'],
          references: { schema: 'public', table: 'concept', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lesson',
        foreignKey: {
          name: 'lesson_chapterId_fkey',
          columns: ['chapterId'],
          references: { schema: 'public', table: 'chapter', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'mCQ',
        foreignKey: {
          name: 'mCQ_questionPaperId_fkey',
          columns: ['questionPaperId'],
          references: { schema: 'public', table: 'questionPaper', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'questionProgress',
        foreignKey: {
          name: 'questionProgress_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'subject',
        foreignKey: {
          name: 'subject_educationLevelId_fkey',
          columns: ['educationLevelId'],
          references: { schema: 'public', table: 'educationLevel', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
