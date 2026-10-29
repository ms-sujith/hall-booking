#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/8891afd8aac5098639a41c9e221740e7bb4b2dc5f86163c73a63477ff6770c00/contract";
import endContract from "../../snapshots/8891afd8aac5098639a41c9e221740e7bb4b2dc5f86163c73a63477ff6770c00/contract.json" with { type: "json" };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from "@prisma/orm-postgres/migration";

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations(): Migration<never, End>["operations"] {
    return [
      this.createSchema({ schema: "public" }),
      this.createTable({
        schema: "public",
        table: "booking",
        columns: [
          col("bookingDate", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("endTime", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("guests", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("hallId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("startTime", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("status", "text", {
            notNull: true,
            default: lit("PENDING"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("totalAmount", "numeric", {
            notNull: true,
            codecRef: { codecId: "pg/numeric@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("userId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "hall",
        columns: [
          col("address", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("amenities", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("capacity", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("city", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("createdByUserId", "int4", {
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("description", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("imageUrl", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("name", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("ownerId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("price", "numeric", {
            notNull: true,
            codecRef: { codecId: "pg/numeric@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "hallOwner",
        columns: [
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("phone", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("userId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "payment",
        columns: [
          col("amount", "numeric", {
            notNull: true,
            codecRef: { codecId: "pg/numeric@1" },
          }),
          col("bookingId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("paidAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("paymentMethod", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("status", "text", {
            notNull: true,
            default: lit("PENDING"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("transactionId", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "review",
        columns: [
          col("comment", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("hallId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("rating", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("userId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "user",
        columns: [
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("email", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("name", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("passwordHash", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("role", "text", {
            notNull: true,
            default: lit("CUSTOMER"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "user_role_check_ca80046b",
            "\"role\" IN ('CUSTOMER', 'OWNER', 'ADMIN')",
          ),
        ],
      }),
      this.addUnique({
        schema: "public",
        table: "hallOwner",
        constraint: "hallOwner_userId_key",
        columns: ["userId"],
      }),
      this.addUnique({
        schema: "public",
        table: "payment",
        constraint: "payment_bookingId_key",
        columns: ["bookingId"],
      }),
      this.addUnique({
        schema: "public",
        table: "payment",
        constraint: "payment_transactionId_key",
        columns: ["transactionId"],
      }),
      this.addUnique({
        schema: "public",
        table: "review",
        constraint: "review_userId_hallId_key",
        columns: ["userId", "hallId"],
      }),
      this.addUnique({
        schema: "public",
        table: "user",
        constraint: "user_email_key",
        columns: ["email"],
      }),
      this.createIndex({
        schema: "public",
        table: "booking",
        index: "booking_hallId_idx_b9a9fbd0",
        columns: ["hallId"],
      }),
      this.createIndex({
        schema: "public",
        table: "booking",
        index: "booking_userId_idx_a489d58a",
        columns: ["userId"],
      }),
      this.createIndex({
        schema: "public",
        table: "hall",
        index: "hall_createdByUserId_idx_93e8a540",
        columns: ["createdByUserId"],
      }),
      this.createIndex({
        schema: "public",
        table: "hall",
        index: "hall_ownerId_idx_e2d0c1ef",
        columns: ["ownerId"],
      }),
      this.createIndex({
        schema: "public",
        table: "review",
        index: "review_hallId_idx_b9a9fbd0",
        columns: ["hallId"],
      }),
      this.createIndex({
        schema: "public",
        table: "review",
        index: "review_userId_idx_a489d58a",
        columns: ["userId"],
      }),
      this.addForeignKey({
        schema: "public",
        table: "booking",
        foreignKey: {
          name: "booking_userId_fkey",
          columns: ["userId"],
          references: { schema: "public", table: "user", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "booking",
        foreignKey: {
          name: "booking_hallId_fkey",
          columns: ["hallId"],
          references: { schema: "public", table: "hall", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "hall",
        foreignKey: {
          name: "hall_ownerId_fkey",
          columns: ["ownerId"],
          references: { schema: "public", table: "hallOwner", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "hall",
        foreignKey: {
          name: "hall_createdByUserId_fkey",
          columns: ["createdByUserId"],
          references: { schema: "public", table: "user", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "hallOwner",
        foreignKey: {
          name: "hallOwner_userId_fkey",
          columns: ["userId"],
          references: { schema: "public", table: "user", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "payment",
        foreignKey: {
          name: "payment_bookingId_fkey",
          columns: ["bookingId"],
          references: { schema: "public", table: "booking", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "review",
        foreignKey: {
          name: "review_userId_fkey",
          columns: ["userId"],
          references: { schema: "public", table: "user", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "review",
        foreignKey: {
          name: "review_hallId_fkey",
          columns: ["hallId"],
          references: { schema: "public", table: "hall", columns: ["id"] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
