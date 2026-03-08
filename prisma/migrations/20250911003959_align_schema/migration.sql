/*
  Warnings:

  - You are about to drop the column `category` on the `Article` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ReactionType" AS ENUM ('LIKE', 'INSIGHTFUL', 'LOVE', 'THANKS');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('ARTICLE', 'QUESTION', 'REFUTATION');

-- DropIndex
DROP INDEX "public"."Article_category_idx";

-- DropIndex
DROP INDEX "public"."User_email_idx";

-- AlterTable
ALTER TABLE "public"."Article" DROP COLUMN "category",
ADD COLUMN     "categoryId" UUID NOT NULL,
ADD COLUMN     "readTime" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Topic" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'PUBLISHED',
    "answered" BOOLEAN NOT NULL DEFAULT false,
    "authorId" UUID,
    "acceptedAnswerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Answer" (
    "id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "questionId" UUID NOT NULL,
    "authorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionTag" (
    "questionId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "QuestionTag_pkey" PRIMARY KEY ("questionId","tagId")
);

-- CreateTable
CREATE TABLE "public"."Refutation" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "public"."Status" NOT NULL DEFAULT 'PUBLISHED',
    "topicId" UUID,
    "authorId" UUID,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Refutation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "articleId" UUID,
    "questionId" UUID,
    "refutationId" UUID,
    "authorId" UUID,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reaction" (
    "id" UUID NOT NULL,
    "type" "public"."ReactionType" NOT NULL DEFAULT 'LIKE',
    "articleId" UUID,
    "questionId" UUID,
    "refutationId" UUID,
    "userId" UUID,
    "anonKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."View" (
    "id" UUID NOT NULL,
    "contentType" "public"."ContentType" NOT NULL,
    "articleId" UUID,
    "questionId" UUID,
    "refutationId" UUID,
    "userId" UUID,
    "anonKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "public"."Topic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "public"."Topic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "public"."Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_key" ON "public"."Question"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Question_acceptedAnswerId_key" ON "public"."Question"("acceptedAnswerId");

-- CreateIndex
CREATE INDEX "Question_createdAt_idx" ON "public"."Question"("createdAt");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "public"."Question"("status");

-- CreateIndex
CREATE INDEX "Question_answered_idx" ON "public"."Question"("answered");

-- CreateIndex
CREATE INDEX "Question_title_idx" ON "public"."Question"("title");

-- CreateIndex
CREATE INDEX "Question_publishedAt_idx" ON "public"."Question"("publishedAt");

-- CreateIndex
CREATE INDEX "Answer_questionId_isAccepted_idx" ON "public"."Answer"("questionId", "isAccepted");

-- CreateIndex
CREATE UNIQUE INDEX "Refutation_slug_key" ON "public"."Refutation"("slug");

-- CreateIndex
CREATE INDEX "Refutation_topicId_idx" ON "public"."Refutation"("topicId");

-- CreateIndex
CREATE INDEX "Refutation_createdAt_idx" ON "public"."Refutation"("createdAt");

-- CreateIndex
CREATE INDEX "Refutation_status_idx" ON "public"."Refutation"("status");

-- CreateIndex
CREATE INDEX "Refutation_publishedAt_idx" ON "public"."Refutation"("publishedAt");

-- CreateIndex
CREATE INDEX "Comment_articleId_idx" ON "public"."Comment"("articleId");

-- CreateIndex
CREATE INDEX "Comment_questionId_idx" ON "public"."Comment"("questionId");

-- CreateIndex
CREATE INDEX "Comment_refutationId_idx" ON "public"."Comment"("refutationId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "public"."Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "public"."Comment"("parentId");

-- CreateIndex
CREATE INDEX "Reaction_articleId_idx" ON "public"."Reaction"("articleId");

-- CreateIndex
CREATE INDEX "Reaction_questionId_idx" ON "public"."Reaction"("questionId");

-- CreateIndex
CREATE INDEX "Reaction_refutationId_idx" ON "public"."Reaction"("refutationId");

-- CreateIndex
CREATE INDEX "Reaction_type_idx" ON "public"."Reaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_reaction_article_user" ON "public"."Reaction"("type", "articleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_reaction_question_user" ON "public"."Reaction"("type", "questionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_reaction_refutation_user" ON "public"."Reaction"("type", "refutationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_reaction_article_anon" ON "public"."Reaction"("type", "articleId", "anonKey");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_reaction_question_anon" ON "public"."Reaction"("type", "questionId", "anonKey");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_reaction_refutation_anon" ON "public"."Reaction"("type", "refutationId", "anonKey");

-- CreateIndex
CREATE INDEX "View_contentType_createdAt_idx" ON "public"."View"("contentType", "createdAt");

-- CreateIndex
CREATE INDEX "View_articleId_idx" ON "public"."View"("articleId");

-- CreateIndex
CREATE INDEX "View_questionId_idx" ON "public"."View"("questionId");

-- CreateIndex
CREATE INDEX "View_refutationId_idx" ON "public"."View"("refutationId");

-- CreateIndex
CREATE INDEX "View_userId_createdAt_idx" ON "public"."View"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "public"."Article"("categoryId");

-- AddForeignKey
ALTER TABLE "public"."Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_acceptedAnswerId_fkey" FOREIGN KEY ("acceptedAnswerId") REFERENCES "public"."Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionTag" ADD CONSTRAINT "QuestionTag_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionTag" ADD CONSTRAINT "QuestionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Refutation" ADD CONSTRAINT "Refutation_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Refutation" ADD CONSTRAINT "Refutation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_refutationId_fkey" FOREIGN KEY ("refutationId") REFERENCES "public"."Refutation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_refutationId_fkey" FOREIGN KEY ("refutationId") REFERENCES "public"."Refutation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_refutationId_fkey" FOREIGN KEY ("refutationId") REFERENCES "public"."Refutation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
