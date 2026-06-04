# Course Publish Log

## 2026-06-04 - IB Big Math G5 Full Republish

- Course: `course-ib-pyp-g5-math` / `IB Big Math G5`
- Source videos: 40 local `.mp4` files from `/Users/johnwu/Documents/自动视频剪辑项目/output/ib_pyp_g5_ep01` through `ib_pyp_g5_ep40`
- Video verification: all 40 files passed `ffprobe` duration checks before upload
- Tencent VOD: all 40 lessons were re-uploaded with `FORCE_REUPLOAD=1`; `data/ib-pyp-g5-vod-map.json` now contains 40 unique file IDs
- Course data: `data/ib-pyp-g5-course.json` now contains 40 lessons and 600 practice questions
- Practice coverage: lessons 21-40 were added with 15 questions per lesson, focused on skill drills for ratios, scale, percent, finance, rational numbers, transformations, linear rules, inequalities, formulas, geometry, measurement, statistics, probability, and capstone review
- Server import: production database verified with 40 lessons, 40 VOD-backed lessons, 40 practice activities, and 600 questions
- Deployment: production build completed and PM2 app `larry-academy` restarted successfully on `43.160.240.248`
- Public check: `https://larryacademy.com/courses/course-ib-pyp-g5-math` returned HTTP 200 and API returned 40 lessons
