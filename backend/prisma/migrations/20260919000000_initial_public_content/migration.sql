-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('CYBERSECURITY', 'DEVELOPMENT', 'DEVOPS');

-- CreateEnum
CREATE TYPE "ProjectSection" AS ENUM ('ARCHITECTURE', 'WORK_PERFORMED', 'RESULT', 'PROBLEM', 'LESSON', 'DOCUMENTATION');

-- CreateEnum
CREATE TYPE "RoadmapStage" AS ENUM ('IMPLEMENTED', 'IN_PROGRESS', 'PLANNED');

-- CreateEnum
CREATE TYPE "SkillGroup" AS ENUM ('PROFESSIONAL', 'TRAINING_AND_LAB');

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "cardTitle" TEXT NOT NULL,
    "pageTitle" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "category" "ProjectCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "repositoryUrl" TEXT,
    "architectureDescription" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technology" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTechnology" (
    "projectId" INTEGER NOT NULL,
    "technologyId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ProjectTechnology_pkey" PRIMARY KEY ("projectId","technologyId")
);

-- CreateTable
CREATE TABLE "ProjectSectionItem" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "section" "ProjectSection" NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ProjectSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRoadmapItem" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stage" "RoadmapStage" NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ProjectRoadmapItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "introduction" TEXT NOT NULL,
    "professionalFocus" TEXT NOT NULL,
    "githubUrl" TEXT NOT NULL,
    "languages" TEXT[],
    "orientation" TEXT[],

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "company" TEXT NOT NULL,
    "clientContext" TEXT,
    "area" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "activities" TEXT[],
    "technologies" TEXT[],
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "program" TEXT NOT NULL,
    "institution" TEXT,
    "status" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "group" "SkillGroup" NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_published_sortOrder_idx" ON "Project"("published", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Technology_slug_key" ON "Technology"("slug");

-- CreateIndex
CREATE INDEX "ProjectTechnology_technologyId_idx" ON "ProjectTechnology"("technologyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTechnology_projectId_sortOrder_key" ON "ProjectTechnology"("projectId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSectionItem_projectId_section_sortOrder_key" ON "ProjectSectionItem"("projectId", "section", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRoadmapItem_projectId_stage_sortOrder_key" ON "ProjectRoadmapItem"("projectId", "stage", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Experience_profileId_sortOrder_key" ON "Experience"("profileId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Education_profileId_sortOrder_key" ON "Education"("profileId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_profileId_group_sortOrder_key" ON "Skill"("profileId", "group", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_profileId_group_name_key" ON "Skill"("profileId", "group", "name");

-- AddForeignKey
ALTER TABLE "ProjectTechnology" ADD CONSTRAINT "ProjectTechnology_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTechnology" ADD CONSTRAINT "ProjectTechnology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSectionItem" ADD CONSTRAINT "ProjectSectionItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRoadmapItem" ADD CONSTRAINT "ProjectRoadmapItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
