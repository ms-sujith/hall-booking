#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/85a7ec2f0addaf2840edae396900bc4e53fa380c827b6246e9f8711562b7d308/contract";
import endContract from "../../snapshots/85a7ec2f0addaf2840edae396900bc4e53fa380c827b6246e9f8711562b7d308/contract.json" with { type: "json" };
import type { Contract as Start } from "../../snapshots/8891afd8aac5098639a41c9e221740e7bb4b2dc5f86163c73a63477ff6770c00/contract";
import startContract from "../../snapshots/8891afd8aac5098639a41c9e221740e7bb4b2dc5f86163c73a63477ff6770c00/contract.json" with { type: "json" };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
} from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations(): Migration<Start, End>["operations"] {
    return [
      this.createTable({
        schema: "public",
        table: "razorpay_webhook_event",
        columns: [
          col("eventId", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("eventType", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("lastError", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("processedAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("receivedAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("status", "text", {
            notNull: true,
            default: lit("RECEIVED"),
            codecRef: { codecId: "pg/text@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.addUnique({
        schema: "public",
        table: "razorpay_webhook_event",
        constraint: "razorpay_webhook_event_eventId_key",
        columns: ["eventId"],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
