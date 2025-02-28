/*
  Warnings:

  - You are about to drop the column `screenResolution` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `windowSize` on the `Visit` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "linkId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "url" TEXT,
    "referrer" TEXT,
    "language" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visit_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Visit" ("createdAt", "id", "ip", "language", "linkId", "referrer", "url", "userAgent") SELECT "createdAt", "id", "ip", "language", "linkId", "referrer", "url", "userAgent" FROM "Visit";
DROP TABLE "Visit";
ALTER TABLE "new_Visit" RENAME TO "Visit";
CREATE INDEX "Visit_linkId_idx" ON "Visit"("linkId");
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
