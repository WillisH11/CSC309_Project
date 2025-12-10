-- CreateTable: Create new TransactionPromotion table with id and nullable promotionId
CREATE TABLE "TransactionPromotion_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transactionId" INTEGER NOT NULL,
    "promotionId" INTEGER,
    CONSTRAINT "TransactionPromotion_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransactionPromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "TransactionPromotion_new" ("transactionId", "promotionId")
SELECT "transactionId", "promotionId" FROM "TransactionPromotion";

-- Drop old table
DROP TABLE "TransactionPromotion";

-- Rename new table
ALTER TABLE "TransactionPromotion_new" RENAME TO "TransactionPromotion";

-- CreateIndex: Create unique constraint on (transactionId, promotionId)
CREATE UNIQUE INDEX "TransactionPromotion_transactionId_promotionId_key" ON "TransactionPromotion"("transactionId", "promotionId");

