#!/usr/bin/env python3
import argparse
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

from qcloud_vod.model import VodUploadRequest
from qcloud_vod.vod_upload_client import VodUploadClient

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_ROOT = pathlib.Path(
    "/Users/johnwu/Library/Mobile Documents/com~apple~CloudDocs/Larry 学习资料/数学小讲师视频库"
)
MANIFEST_PATH = PROJECT_ROOT / "data" / "larry-math-video-manifest.json"
VOD_MAP_PATH = PROJECT_ROOT / "data" / "larry-math-vod-map.json"
LOG_DIR = PROJECT_ROOT / "docs" / "vod-upload-logs"
COURSE_ID = "course-larry-math-class-library"
LIBRARY_ID = "larry-math-class-library"
MIN_MULTIPART_UPLOAD_SIZE = 6 * 1024 * 1024
VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v"}
EPISODE_RE = re.compile(r"larry\s*math(?:\s*class)?\s*(\d+)", re.IGNORECASE)


def upload_cos_with_small_file_fix(cos_client, local_path, bucket, cos_path, max_thread, progress_callback):
    upload_path = pathlib.Path(local_path)
    temp_path = None
    if upload_path.stat().st_size < MIN_MULTIPART_UPLOAD_SIZE:
        temp_dir = pathlib.Path(tempfile.mkdtemp(prefix="larry-vod-pad-"))
        temp_path = temp_dir / upload_path.name
        shutil.copyfile(upload_path, temp_path)
        with temp_path.open("ab") as padded:
            padded.write(b"\0" * (MIN_MULTIPART_UPLOAD_SIZE - temp_path.stat().st_size))
        upload_path = temp_path

    try:
        cos_client.upload_file(
            Bucket=bucket,
            LocalFilePath=str(upload_path),
            Key=cos_path,
            PartSize=5,
            MAXThread=max_thread or 2,
            progress_callback=progress_callback,
        )
    finally:
        if temp_path:
            shutil.rmtree(temp_path.parent, ignore_errors=True)


VodUploadClient.upload_cos = staticmethod(upload_cos_with_small_file_fix)


def read_json(path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def load_credentials():
    secret_id = os.environ.get("TENCENTCLOUD_SECRET_ID")
    secret_key = os.environ.get("TENCENTCLOUD_SECRET_KEY")
    token = os.environ.get("TENCENTCLOUD_TOKEN")
    if secret_id and secret_key:
        return secret_id, secret_key, token

    credential_path = pathlib.Path.home() / ".tccli" / "default.credential"
    if not credential_path.exists():
        raise RuntimeError(
            "Missing Tencent credentials. Set TENCENTCLOUD_SECRET_ID/TENCENTCLOUD_SECRET_KEY "
            "or configure ~/.tccli/default.credential."
        )

    data = read_json(credential_path, {})
    return data["secretId"], data["secretKey"], token


def episode_from_name(path):
    for part in [path.name, *reversed(path.parts)]:
        match = EPISODE_RE.search(part)
        if match:
            return int(match.group(1))
    return None


def collect_video_files(source_root):
    main = {}
    compressed = {}
    duplicates = {}
    compressed_parts = {"compressed", "compress", "compressed videos", "压缩", "压缩版"}

    for path in source_root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in VIDEO_EXTENSIONS:
            continue
        episode = episode_from_name(path)
        if episode is None:
            continue

        is_compressed = any(part.lower() in compressed_parts for part in path.parts)
        bucket = compressed if is_compressed else main
        duplicates.setdefault(str(episode), []).append(str(path))
        current = bucket.get(episode)
        if current is None or path.stat().st_size < current.stat().st_size:
            bucket[episode] = path

    return main, compressed, duplicates


def ffprobe_duration(path):
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return None
    result = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    try:
        return round(float(result.stdout.strip()), 3)
    except ValueError:
        return None


def allocated_bytes(path):
    result = subprocess.run(["du", "-k", str(path)], text=True, capture_output=True, check=False)
    if result.returncode != 0 or not result.stdout.strip():
        return None
    try:
        return int(result.stdout.split()[0]) * 1024
    except ValueError:
        return None


def compress_video(source_path, output_path, logger, dry_run=False):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required to compress missing Larry Math videos.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists() and output_path.stat().st_size > 0:
        logger("compress_skip_existing", {"episode": episode_from_name(source_path), "path": str(output_path)})
        return output_path

    logger("compress_start", {"episode": episode_from_name(source_path), "source": str(source_path), "output": str(output_path)})
    if dry_run:
        return output_path

    temp_output = output_path.with_name(output_path.stem + ".tmp" + output_path.suffix)
    encoder = os.environ.get("LARRY_MATH_FFMPEG_ENCODER", "h264_videotoolbox")
    command = [ffmpeg, "-y", "-i", str(source_path), "-vf", "scale='min(1280,iw)':-2"]
    if encoder == "h264_videotoolbox":
        command.extend(["-c:v", "h264_videotoolbox", "-b:v", os.environ.get("LARRY_MATH_VIDEO_BITRATE", "3500k"), "-allow_sw", "1"])
    else:
        command.extend(["-c:v", "libx264", "-preset", os.environ.get("LARRY_MATH_X264_PRESET", "veryfast"), "-crf", os.environ.get("LARRY_MATH_X264_CRF", "24")])
    command.extend(["-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(temp_output)])
    subprocess.run(command, check=True)
    temp_output.replace(output_path)
    logger(
        "compress_done",
        {
            "episode": episode_from_name(source_path),
            "sourceBytes": source_path.stat().st_size,
            "outputBytes": output_path.stat().st_size,
            "output": str(output_path),
        },
    )
    return output_path


def build_manifest(source_root, compressed_root, compress_missing, logger, dry_run=False, probe_duration=False, skip_unavailable=False, only_episodes=None):
    main, compressed, duplicates = collect_video_files(source_root)
    episodes = sorted(set(main) | set(compressed))
    if only_episodes:
        episodes = [episode for episode in episodes if episode in only_episodes]
    selected = []
    missing_compressed = []
    unavailable_source_episodes = []

    for episode in episodes:
        source_path = compressed.get(episode)
        compressed_generated = False
        if source_path is None:
            missing_compressed.append(episode)
            source_original = main.get(episode)
            if compress_missing and source_original:
                allocated = allocated_bytes(source_original)
                if allocated == 0:
                    unavailable_source_episodes.append(
                        {
                            "episode": episode,
                            "sourcePath": str(source_original),
                            "reason": "iCloud placeholder has zero allocated bytes",
                        }
                    )
                    logger("compress_source_unavailable", {"episode": episode, "source": str(source_original), "reason": "zero allocated bytes"})
                    if skip_unavailable:
                        continue
                output_path = compressed_root / f"Larry Math Class {episode}_compressed.mp4"
                source_path = compress_video(source_original, output_path, logger, dry_run=dry_run)
                compressed_generated = True
            else:
                source_path = source_original

        if source_path is None:
            continue

        allocated = allocated_bytes(source_path) if source_path.exists() else None
        if allocated == 0:
            unavailable_source_episodes.append(
                {
                    "episode": episode,
                    "sourcePath": str(source_path),
                    "reason": "selected video is an iCloud placeholder with zero allocated bytes",
                }
            )
            logger("selected_source_unavailable", {"episode": episode, "source": str(source_path), "reason": "zero allocated bytes"})
            if skip_unavailable:
                continue

        stat = source_path.stat() if source_path.exists() else None
        selected.append(
            {
                "id": f"larry-math-class-{episode:03d}",
                "episode": episode,
                "title": f"Larry Math Class {episode}",
                "selectedPath": str(source_path),
                "sourceFileName": source_path.name,
                "isCompressed": "compressed" in [part.lower() for part in source_path.parts] or compressed_generated,
                "compressedGenerated": compressed_generated,
                "sizeBytes": stat.st_size if stat else None,
                "allocatedBytes": allocated,
                "durationSeconds": ffprobe_duration(source_path) if stat and probe_duration else None,
            }
        )

    full_range_missing = []
    if episodes:
        full_range_missing = [episode for episode in range(episodes[0], episodes[-1] + 1) if episode not in episodes]

    manifest = {
        "generatedAt": utc_now(),
        "courseId": COURSE_ID,
        "libraryId": LIBRARY_ID,
        "sourceRoot": str(source_root),
        "compressedRoot": str(compressed_root),
        "episodeCount": len(selected),
        "episodeRange": [episodes[0], episodes[-1]] if episodes else None,
        "missingEpisodesInRange": full_range_missing,
        "episodesMissingCompressedBeforeRun": missing_compressed,
        "unavailableSourceEpisodes": unavailable_source_episodes,
        "selected": selected,
        "duplicates": duplicates,
    }
    write_json(MANIFEST_PATH, manifest)
    return manifest


def make_logger(log_path):
    log_path.parent.mkdir(parents=True, exist_ok=True)

    def logger(event, payload):
        row = {"time": utc_now(), "event": event, **payload}
        with log_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        print(json.dumps(row, ensure_ascii=False), flush=True)

    return logger


def parse_episode_filter(value):
    if not value:
        return None
    selected = set()
    for chunk in value.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        if "-" in chunk:
            left, right = chunk.split("-", 1)
            selected.update(range(int(left), int(right) + 1))
        else:
            selected.add(int(chunk))
    return selected


def upload_manifest(manifest, logger, dry_run=False, force=False, only_episodes=None, probe_duration=False):
    vod_map = read_json(VOD_MAP_PATH, {})
    if dry_run:
        logger("dry_run_upload_summary", {"selectedCount": len(manifest["selected"]), "existingVodEntries": len(vod_map)})
        return vod_map

    region = os.environ.get("TENCENT_VOD_REGION", "ap-shanghai")
    sub_app_id = os.environ.get("TENCENT_VOD_SUB_APP_ID")
    storage_region = os.environ.get("TENCENT_VOD_STORAGE_REGION")
    secret_id, secret_key, token = load_credentials()
    client = VodUploadClient(secret_id, secret_key, token)

    for item in manifest["selected"]:
        if only_episodes and item["episode"] not in only_episodes:
            continue

        existing = vod_map.get(item["id"])
        if isinstance(existing, str):
            existing = {"fileId": existing}
        if existing and existing.get("fileId") and not force:
            logger("upload_skip_existing", {"id": item["id"], "episode": item["episode"], "fileId": existing.get("fileId")})
            continue

        media_path = pathlib.Path(item["selectedPath"])
        if not media_path.exists() or media_path.stat().st_size == 0:
            raise RuntimeError(f"Missing or empty video file: {media_path}")

        request = VodUploadRequest()
        request.MediaFilePath = str(media_path)
        request.MediaName = item["title"]
        request.MediaType = media_path.suffix.lstrip(".")
        if media_path.stat().st_size >= 32 * 1024 * 1024:
            request.ConcurrentUploadNumber = int(os.environ.get("TENCENT_VOD_UPLOAD_CONCURRENCY", "4"))
        request.SourceContext = json.dumps(
            {
                "courseId": COURSE_ID,
                "libraryId": LIBRARY_ID,
                "lessonId": item["id"],
                "episode": item["episode"],
                "sourceFileName": item["sourceFileName"],
            },
            ensure_ascii=False,
        )
        if sub_app_id:
            request.SubAppId = int(sub_app_id)
        if storage_region:
            request.StorageRegion = storage_region

        logger("upload_start", {"id": item["id"], "episode": item["episode"], "path": str(media_path), "bytes": media_path.stat().st_size})
        response = client.upload(region, request)
        vod_map[item["id"]] = {
            "episode": item["episode"],
            "title": item["title"],
            "fileId": response.FileId,
            "mediaUrl": getattr(response, "MediaUrl", None),
            "sourcePath": str(media_path),
            "sourceFileName": item["sourceFileName"],
            "sizeBytes": media_path.stat().st_size,
            "durationSeconds": ffprobe_duration(media_path) if probe_duration else item.get("durationSeconds"),
            "uploadedAt": utc_now(),
        }
        write_json(VOD_MAP_PATH, vod_map)
        logger("upload_done", {"id": item["id"], "episode": item["episode"], "fileId": response.FileId, "mediaUrl": getattr(response, "MediaUrl", None)})

    return vod_map


def main():
    parser = argparse.ArgumentParser(description="Compress missing Larry Math videos and upload the selected library to Tencent VOD.")
    parser.add_argument("--source-root", default=os.environ.get("LARRY_MATH_SOURCE_ROOT", str(DEFAULT_SOURCE_ROOT)))
    parser.add_argument("--compressed-root", default=os.environ.get("LARRY_MATH_COMPRESSED_ROOT"))
    parser.add_argument("--dry-run", action="store_true", default=os.environ.get("DRY_RUN") == "1")
    parser.add_argument("--manifest-only", action="store_true")
    parser.add_argument("--no-compress-missing", action="store_true")
    parser.add_argument("--skip-unavailable", action="store_true", default=os.environ.get("SKIP_UNAVAILABLE") == "1")
    parser.add_argument("--probe-duration", action="store_true", default=os.environ.get("PROBE_DURATION") == "1")
    parser.add_argument("--force-reupload", action="store_true", default=os.environ.get("FORCE_REUPLOAD") == "1")
    parser.add_argument("--only-episodes", default=os.environ.get("ONLY_EPISODES"))
    args = parser.parse_args()

    source_root = pathlib.Path(args.source_root).expanduser()
    compressed_root = pathlib.Path(args.compressed_root).expanduser() if args.compressed_root else source_root / "compressed"
    if not source_root.exists():
        raise RuntimeError(f"Missing source root: {source_root}")

    log_path = LOG_DIR / f"larry-math-{datetime.now().strftime('%Y%m%d-%H%M%S')}.jsonl"
    logger = make_logger(log_path)
    logger("run_start", {"sourceRoot": str(source_root), "compressedRoot": str(compressed_root), "dryRun": args.dry_run})
    only_episodes = parse_episode_filter(args.only_episodes)
    manifest = build_manifest(
        source_root,
        compressed_root,
        compress_missing=not args.no_compress_missing,
        logger=logger,
        dry_run=args.dry_run,
        probe_duration=args.probe_duration,
        skip_unavailable=args.skip_unavailable,
        only_episodes=only_episodes,
    )
    logger(
        "manifest_done",
        {
            "episodeCount": manifest["episodeCount"],
            "missingCompressedBeforeRun": manifest["episodesMissingCompressedBeforeRun"],
            "manifestPath": str(MANIFEST_PATH),
        },
    )
    if args.manifest_only:
        logger("run_done", {"mode": "manifest-only", "logPath": str(log_path)})
        return

    vod_map = upload_manifest(
        manifest,
        logger,
        dry_run=args.dry_run,
        force=args.force_reupload,
        only_episodes=only_episodes,
        probe_duration=args.probe_duration,
    )
    uploaded_count = sum(1 for value in vod_map.values() if isinstance(value, dict) and value.get("fileId"))
    logger("run_done", {"vodMapPath": str(VOD_MAP_PATH), "uploadedOrRecordedCount": uploaded_count, "logPath": str(log_path)})


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"larry math vod upload failed: {exc}", file=sys.stderr)
        sys.exit(1)
