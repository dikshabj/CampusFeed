-- CreateTable
CREATE TABLE "Timetable" (
    "id" SERIAL NOT NULL,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "room" TEXT,
    "branch" TEXT NOT NULL,
    "section" TEXT,
    "semester" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
