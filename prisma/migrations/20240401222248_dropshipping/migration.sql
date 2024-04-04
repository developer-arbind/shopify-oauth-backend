-- CreateTable
CREATE TABLE "Reviews" (
    "id" TEXT NOT NULL,
    "idt" TEXT,
    "paid" INTEGER NOT NULL,
    "profilePicture" TEXT NOT NULL,
    "rating" INTEGER,
    "review" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "gigFrom" TEXT,
    "etc" TEXT,
    "freelancerId" TEXT NOT NULL,
    "freelancerIds" TEXT,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gig" (
    "id" TEXT NOT NULL,
    "etc" TEXT,
    "completed" INTEGER NOT NULL,
    "from" TEXT NOT NULL,
    "idt" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "picture" TEXT NOT NULL,
    "freelancerId" TEXT,

    CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "freelancerId" TEXT,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lawlite" (
    "id" TEXT NOT NULL,
    "failed" BOOLEAN NOT NULL,
    "fdate" TEXT NOT NULL,
    "fromGig" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "freelancerIds" TEXT,
    "idt" TEXT NOT NULL,
    "paid" INTEGER NOT NULL,
    "rating" INTEGER,
    "tip" INTEGER NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "Lawlite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Freelancer" (
    "id" TEXT NOT NULL,
    "bestseller" BOOLEAN NOT NULL,
    "description" TEXT NOT NULL,
    "earnings" INTEGER NOT NULL,
    "earningsWithTip" INTEGER NOT NULL,
    "freelancerName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "idt" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ratings" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "runningAd" BOOLEAN NOT NULL,
    "topRated" BOOLEAN NOT NULL,
    "verified" BOOLEAN NOT NULL,

    CONSTRAINT "Freelancer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gig_etc_key" ON "Gig"("etc");

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_etc_fkey" FOREIGN KEY ("etc") REFERENCES "Gig"("etc") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_freelancerIds_fkey" FOREIGN KEY ("freelancerIds") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gig" ADD CONSTRAINT "Gig_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lawlite" ADD CONSTRAINT "Lawlite_freelancerIds_fkey" FOREIGN KEY ("freelancerIds") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
