#!/usr/bin/env python3
import datetime as dt
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "ib-myp-g6-course.json"
DB_PATH = ROOT / "prisma" / "prisma" / "dev.db"
VOD_MAP_PATH = ROOT / "data" / "ib-myp-g6-vod-map.json"


def now():
    return dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def read_json(path, fallback=None):
    if not path.exists():
        if fallback is not None:
            return fallback
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def bool_int(value):
    return 1 if value else 0


def main():
    course = read_json(DATA_PATH)
    vod_map = read_json(VOD_MAP_PATH, {})
    stamp = now()
    lessons = course["lessons"]
    lesson_ids = [lesson["id"] for lesson in lessons]
    total_duration = sum(int(lesson.get("duration") or 0) for lesson in lessons)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute(
            """
            INSERT INTO Course (
              id, title, description, price, isFree, accessLevel, category, courseTrack,
              status, expectedFeatures, difficultyLevel, videoUrl, videoProvider,
              youtubeVideoId, tencentVodFileId, stripePriceId, thumbnailUrl, duration,
              viewCount, enrollmentCount, featured, published, gradeLevel, difficulty,
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, NULL, NULL, ?, ?, 0, 0, 1, 1, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title=excluded.title,
              description=excluded.description,
              price=excluded.price,
              isFree=excluded.isFree,
              accessLevel=excluded.accessLevel,
              category=excluded.category,
              courseTrack=excluded.courseTrack,
              status=excluded.status,
              expectedFeatures=excluded.expectedFeatures,
              difficultyLevel=excluded.difficultyLevel,
              videoProvider=excluded.videoProvider,
              thumbnailUrl=excluded.thumbnailUrl,
              duration=excluded.duration,
              featured=excluded.featured,
              published=excluded.published,
              gradeLevel=excluded.gradeLevel,
              difficulty=excluded.difficulty,
              updatedAt=excluded.updatedAt
            """,
            (
                course["id"],
                course["title"],
                course["description"],
                float(course.get("price", 0)),
                bool_int(course.get("isFree")),
                course["accessLevel"],
                course["category"],
                course["courseTrack"],
                course["status"],
                json.dumps(course.get("expectedFeatures", []), ensure_ascii=False),
                course["difficultyLevel"],
                course["videoProvider"],
                course.get("thumbnailUrl"),
                total_duration,
                course["gradeLevel"],
                course["difficulty"],
                stamp,
                stamp,
            ),
        )

        placeholders = ",".join("?" for _ in lesson_ids)
        conn.execute(
            f"DELETE FROM LessonActivity WHERE courseId = ? AND lessonId NOT IN ({placeholders})",
            [course["id"], *lesson_ids],
        )
        conn.execute(
            f"DELETE FROM Lesson WHERE courseId = ? AND id NOT IN ({placeholders})",
            [course["id"], *lesson_ids],
        )

        for lesson in lessons:
            vod_entry = vod_map.get(lesson["id"])
            file_id = vod_entry if isinstance(vod_entry, str) else (vod_entry or {}).get("fileId")
            media_url = None if isinstance(vod_entry, str) else (vod_entry or {}).get("mediaUrl")
            conn.execute(
                """
                INSERT INTO Lesson (
                  id, courseId, title, description, videoUrl, videoProvider, youtubeVideoId,
                  tencentVodFileId, "order", duration, isPreview, hasPractice, hasGame,
                  rewardsPoints, rewardsGems, viewCount, gradeLevel, difficulty, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  courseId=excluded.courseId,
                  title=excluded.title,
                  description=excluded.description,
                  videoUrl=excluded.videoUrl,
                  videoProvider=excluded.videoProvider,
                  tencentVodFileId=excluded.tencentVodFileId,
                  "order"=excluded."order",
                  duration=excluded.duration,
                  isPreview=excluded.isPreview,
                  hasPractice=excluded.hasPractice,
                  hasGame=excluded.hasGame,
                  rewardsPoints=excluded.rewardsPoints,
                  rewardsGems=excluded.rewardsGems,
                  gradeLevel=excluded.gradeLevel,
                  difficulty=excluded.difficulty,
                  updatedAt=excluded.updatedAt
                """,
                (
                    lesson["id"],
                    course["id"],
                    lesson["title"],
                    lesson.get("description"),
                    media_url,
                    lesson.get("videoProvider"),
                    file_id,
                    int(lesson["order"]),
                    int(lesson.get("duration") or 0),
                    bool_int(lesson.get("isPreview")),
                    bool_int(lesson.get("hasPractice")),
                    bool_int(lesson.get("hasGame")),
                    int(lesson.get("rewardsPoints") or 0),
                    int(lesson.get("rewardsGems") or 0),
                    lesson.get("gradeLevel"),
                    lesson.get("difficulty"),
                    stamp,
                    stamp,
                ),
            )

            activity_id = f"activity-ib-myp-g6-ep{int(lesson['order']):02d}-practice"
            conn.execute(
                """
                INSERT INTO LessonActivity (
                  id, courseId, lessonId, type, title, description, config, provider,
                  "order", isRequired, rewardsPoints, rewardsGems, published, createdAt, updatedAt
                ) VALUES (?, ?, ?, 'practice', ?, ?, ?, 'internal-practice', 1, 1, ?, ?, 1, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  courseId=excluded.courseId,
                  lessonId=excluded.lessonId,
                  type=excluded.type,
                  title=excluded.title,
                  description=excluded.description,
                  config=excluded.config,
                  provider=excluded.provider,
                  "order"=excluded."order",
                  isRequired=excluded.isRequired,
                  rewardsPoints=excluded.rewardsPoints,
                  rewardsGems=excluded.rewardsGems,
                  published=excluded.published,
                  updatedAt=excluded.updatedAt
                """,
                (
                    activity_id,
                    course["id"],
                    lesson["id"],
                    f"{lesson['title']} Practice Quest",
                    "20-question adaptive mastery quest with SVG visuals, hint-first feedback, wrong-question review, points, gems, and streak rewards.",
                    json.dumps(lesson["practice"], ensure_ascii=False),
                    int(lesson.get("rewardsPoints") or 0),
                    int(lesson.get("rewardsGems") or 0),
                    stamp,
                    stamp,
                ),
            )

    question_count = sum(len(lesson["practice"]["questions"]) for lesson in lessons)
    print(f"Imported {len(lessons)} lessons and {question_count} questions into {DB_PATH}")


if __name__ == "__main__":
    main()
