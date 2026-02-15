/*
  Warnings:

  - You are about to drop the column `frequency` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `impact` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `risk` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `urgency` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "frequency",
DROP COLUMN "impact",
DROP COLUMN "risk",
DROP COLUMN "urgency";

-- CreateTable
CREATE TABLE "PriorityParam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityParam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParamEvalItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParamEvalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityParamEvalItem" (
    "priorityParamId" TEXT NOT NULL,
    "paramEvalItemId" TEXT NOT NULL,

    CONSTRAINT "PriorityParamEvalItem_pkey" PRIMARY KEY ("priorityParamId","paramEvalItemId")
);

-- CreateTable
CREATE TABLE "GroupPriorityParam" (
    "groupId" TEXT NOT NULL,
    "priorityParamId" TEXT NOT NULL,

    CONSTRAINT "GroupPriorityParam_pkey" PRIMARY KEY ("groupId","priorityParamId")
);

-- CreateTable
CREATE TABLE "ItemParamAnswer" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "priorityParamId" TEXT NOT NULL,
    "paramEvalItemId" TEXT NOT NULL,

    CONSTRAINT "ItemParamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriorityParam_name_userId_key" ON "PriorityParam"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemParamAnswer_itemId_priorityParamId_key" ON "ItemParamAnswer"("itemId", "priorityParamId");

-- AddForeignKey
ALTER TABLE "PriorityParam" ADD CONSTRAINT "PriorityParam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParamEvalItem" ADD CONSTRAINT "ParamEvalItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityParamEvalItem" ADD CONSTRAINT "PriorityParamEvalItem_priorityParamId_fkey" FOREIGN KEY ("priorityParamId") REFERENCES "PriorityParam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityParamEvalItem" ADD CONSTRAINT "PriorityParamEvalItem_paramEvalItemId_fkey" FOREIGN KEY ("paramEvalItemId") REFERENCES "ParamEvalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPriorityParam" ADD CONSTRAINT "GroupPriorityParam_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPriorityParam" ADD CONSTRAINT "GroupPriorityParam_priorityParamId_fkey" FOREIGN KEY ("priorityParamId") REFERENCES "PriorityParam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemParamAnswer" ADD CONSTRAINT "ItemParamAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemParamAnswer" ADD CONSTRAINT "ItemParamAnswer_priorityParamId_fkey" FOREIGN KEY ("priorityParamId") REFERENCES "PriorityParam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemParamAnswer" ADD CONSTRAINT "ItemParamAnswer_paramEvalItemId_fkey" FOREIGN KEY ("paramEvalItemId") REFERENCES "ParamEvalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
