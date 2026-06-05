# Course Publish Log

## 2026-06-04 - Larry Math VOD Upload Pass 1

- Course/library: `course-larry-math-class-library` / Larry Math Class Library
- Source videos: `/Users/johnwu/Library/Mobile Documents/com~apple~CloudDocs/Larry 学习资料/数学小讲师视频库`
- Upload policy: prefer files under `compressed/`; if an episode has no compressed file and the original is local, compress it first with `scripts/upload-larry-math-videos-to-tencent-vod.py`
- Compression completed in this pass: episodes `169, 172, 174, 177, 178, 179, 182`
- Tencent VOD uploaded in this pass: 68 local compressed videos; all 68 entries have `fileId` and `mediaUrl` in `data/larry-math-vod-map.json`
- Pending iCloud-localization items: 67 episodes are present as iCloud placeholders with zero allocated bytes and were skipped safely; see `data/larry-math-video-manifest.json` under `unavailableSourceEpisodes`
- Missing episode numbers in the discovered 1-182 range are recorded in `data/larry-math-video-manifest.json` under `missingEpisodesInRange`
- Detailed run log: `docs/vod-upload-logs/larry-math-20260604-221155.jsonl`
- Reusable command: `python3 scripts/upload-larry-math-videos-to-tencent-vod.py --skip-unavailable`; after iCloud downloads pending videos locally, rerun the same command to continue without reuploading existing VOD entries

## 2026-06-04 - Larry Math VOD Upload Pass 2

- Continued from the same source library and reusable upload script after several iCloud placeholder files localized.
- Newly uploaded to Tencent VOD: episodes `22, 147, 152, 168`.
- Episode `168` had no compressed local copy, so it was compressed first to `compressed/Larry Math Class 168_compressed.mp4` and then uploaded.
- Total Larry Math VOD entries after this pass: 72 episodes in `data/larry-math-vod-map.json`.
- Remaining iCloud-localization blockers: 63 episodes are still visible in iCloud Drive but have zero allocated bytes locally; the system reports `isDownloadRequested=1` and `isDownloading=1`, but controlled reads still time out without materializing data.
- Remaining zero-byte placeholder episodes: `1, 2, 4, 6, 9, 10, 12, 14, 16, 18, 21, 27, 29, 30, 32, 33, 34, 35, 37, 38, 40, 46, 47, 51, 52, 54, 56, 57, 59, 60, 64, 65, 68, 69, 70, 72, 94, 95, 96, 98, 100, 105, 108, 111, 113, 115, 119, 120, 122, 123, 127, 128, 130, 136, 138, 139, 140, 141, 150, 155, 156, 157, 167`.
- Detailed run log: `docs/vod-upload-logs/larry-math-20260604-230939.jsonl`

## 2026-06-05 - Larry Math VOD Upload Pass 3

- Rechecked the remaining iCloud placeholders after iCloud Drive localized most files overnight.
- Newly uploaded to Tencent VOD: 62 more Larry Math episodes from the previously blocked placeholder set.
- Total Larry Math VOD entries after this pass: 134 episodes in `data/larry-math-vod-map.json`.
- Verification: sampled new VOD URLs for episodes `1, 30, 72, 100, 155, 167`; each returned HTTP 200 with the expected video content type and size.
- Remaining VOD gap: episode `127` only. Its compressed and original video files are still zero-byte iCloud placeholders locally; `fileproviderctl` reports `isDownloadRequested=1` and `isDownloading=1`, but controlled reads still time out without materializing data.
- Episode `101` also has a zero-byte local source placeholder, but it already has an existing VOD entry and is not a publication gap.
- Detailed run log: `docs/vod-upload-logs/larry-math-20260605-073709.jsonl`

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
