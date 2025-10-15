/*
  Warnings:

  - Added the required column `city` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identificationDocId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identificationDocType` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postcode` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street1` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."SubscriptionPlan" ADD VALUE 'TEST_MONTHLY';

-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "identificationDocId" TEXT NOT NULL,
ADD COLUMN     "identificationDocType" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "postcode" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "street1" TEXT NOT NULL;
