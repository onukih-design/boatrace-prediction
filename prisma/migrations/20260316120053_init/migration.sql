-- CreateTable
CREATE TABLE "Venue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Racer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "registrationNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT,
    "birthDate" DATETIME,
    "rank" TEXT,
    "winRate" REAL NOT NULL DEFAULT 0,
    "biaxialRate" REAL NOT NULL DEFAULT 0,
    "triaxialRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Motor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "motorNo" TEXT NOT NULL,
    "venueId" INTEGER NOT NULL,
    "biaxialRate" REAL NOT NULL DEFAULT 0,
    "triaxialRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Boat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "boatNo" TEXT NOT NULL,
    "venueId" INTEGER NOT NULL,
    "biaxialRate" REAL NOT NULL DEFAULT 0,
    "triaxialRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Race" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "raceDate" DATETIME NOT NULL,
    "venueId" INTEGER NOT NULL,
    "raceNumber" INTEGER NOT NULL,
    "raceTitle" TEXT,
    "deadline" DATETIME,
    "weather" TEXT,
    "windSpeed" REAL,
    "windDirection" TEXT,
    "waveHeight" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Race_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RaceEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "raceId" INTEGER NOT NULL,
    "lane" INTEGER NOT NULL,
    "racerId" INTEGER NOT NULL,
    "motorId" INTEGER,
    "boatId" INTEGER,
    "weight" REAL,
    "exhibitionTime" REAL,
    "tiltAngle" REAL,
    "startTiming" REAL,
    "result" INTEGER,
    "startResult" TEXT,
    "raceTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RaceEntry_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RaceEntry_racerId_fkey" FOREIGN KEY ("racerId") REFERENCES "Racer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RaceEntry_motorId_fkey" FOREIGN KEY ("motorId") REFERENCES "Motor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RaceEntry_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "raceId" INTEGER NOT NULL,
    "lane" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "rank" INTEGER NOT NULL,
    "factors" TEXT NOT NULL,
    "isHit" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prediction_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LineUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "pictureUrl" TEXT,
    "statusMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lineUserId" INTEGER NOT NULL,
    "favoriteVenues" TEXT NOT NULL DEFAULT '[]',
    "notifyBeforeRace" BOOLEAN NOT NULL DEFAULT true,
    "notifyResult" BOOLEAN NOT NULL DEFAULT true,
    "notifyTopPicks" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSetting_lineUserId_fkey" FOREIGN KEY ("lineUserId") REFERENCES "LineUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lineUserId" INTEGER NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryLog_lineUserId_fkey" FOREIGN KEY ("lineUserId") REFERENCES "LineUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScrapeJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobType" TEXT NOT NULL,
    "targetDate" DATETIME,
    "venueCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "errorMessage" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HitSummary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "targetDate" DATETIME NOT NULL,
    "totalRaces" INTEGER NOT NULL DEFAULT 0,
    "predictedRaces" INTEGER NOT NULL DEFAULT 0,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "hitRate" REAL NOT NULL DEFAULT 0,
    "topPickHits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Venue_code_key" ON "Venue"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Racer_registrationNo_key" ON "Racer"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "Motor_motorNo_venueId_key" ON "Motor"("motorNo", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "Boat_boatNo_venueId_key" ON "Boat"("boatNo", "venueId");

-- CreateIndex
CREATE INDEX "Race_raceDate_idx" ON "Race"("raceDate");

-- CreateIndex
CREATE INDEX "Race_venueId_idx" ON "Race"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "Race_raceDate_venueId_raceNumber_key" ON "Race"("raceDate", "venueId", "raceNumber");

-- CreateIndex
CREATE INDEX "RaceEntry_racerId_idx" ON "RaceEntry"("racerId");

-- CreateIndex
CREATE INDEX "RaceEntry_raceId_idx" ON "RaceEntry"("raceId");

-- CreateIndex
CREATE UNIQUE INDEX "RaceEntry_raceId_lane_key" ON "RaceEntry"("raceId", "lane");

-- CreateIndex
CREATE INDEX "Prediction_raceId_idx" ON "Prediction"("raceId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_raceId_lane_key" ON "Prediction"("raceId", "lane");

-- CreateIndex
CREATE UNIQUE INDEX "LineUser_lineUserId_key" ON "LineUser"("lineUserId");

-- CreateIndex
CREATE INDEX "LineUser_isActive_idx" ON "LineUser"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_lineUserId_key" ON "UserSetting"("lineUserId");

-- CreateIndex
CREATE INDEX "DeliveryLog_lineUserId_idx" ON "DeliveryLog"("lineUserId");

-- CreateIndex
CREATE INDEX "DeliveryLog_sentAt_idx" ON "DeliveryLog"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HitSummary_targetDate_key" ON "HitSummary"("targetDate");
