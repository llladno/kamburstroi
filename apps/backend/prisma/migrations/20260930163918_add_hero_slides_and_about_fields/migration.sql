-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "aboutPhotoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "foundingYear" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "specialization" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);
