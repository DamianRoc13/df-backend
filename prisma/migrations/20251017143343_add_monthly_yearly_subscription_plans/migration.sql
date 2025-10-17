/*
  Warnings:

  - Made the column `city` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `postcode` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `customers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."SubscriptionPlan" ADD VALUE 'MONTHLY';
ALTER TYPE "public"."SubscriptionPlan" ADD VALUE 'YEARLY';

-- AlterTable
ALTER TABLE "public"."customers" ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "postcode" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL;
