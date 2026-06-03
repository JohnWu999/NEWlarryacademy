#!/usr/bin/env python3
import json
import os
import pathlib
import sys

from qcloud_vod.model import VodUploadRequest
from qcloud_vod.vod_upload_client import VodUploadClient

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE_ROOT = pathlib.Path("/Users/johnwu/Documents/自动视频剪辑项目/output")
COURSE_DATA = PROJECT_ROOT / "data" / "ngss-g7-science-course.json"
VOD_MAP = PROJECT_ROOT / "data" / "ngss-g7-vod-map.json"


def read_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_credentials():
    secret_id = os.environ.get("TENCENTCLOUD_SECRET_ID")
    secret_key = os.environ.get("TENCENTCLOUD_SECRET_KEY")
    token = os.environ.get("TENCENTCLOUD_TOKEN")
    if secret_id and secret_key:
        return secret_id, secret_key, token

    credential_path = pathlib.Path.home() / ".tccli" / "default.credential"
    if not credential_path.exists():
        raise RuntimeError("Missing Tencent credentials. Set TENCENTCLOUD_SECRET_ID/TENCENTCLOUD_SECRET_KEY or configure ~/.tccli/default.credential.")

    data = read_json(credential_path)
    return data["secretId"], data["secretKey"], token


def main():
    region = os.environ.get("TENCENT_VOD_REGION", "ap-shanghai")
    sub_app_id = os.environ.get("TENCENT_VOD_SUB_APP_ID")
    storage_region = os.environ.get("TENCENT_VOD_STORAGE_REGION")

    secret_id, secret_key, token = load_credentials()
    client = VodUploadClient(secret_id, secret_key, token)
    course = read_json(COURSE_DATA)
    vod_map = read_json(VOD_MAP) if VOD_MAP.exists() else {}

    for lesson in course["lessons"]:
        existing = vod_map.get(lesson["id"])
        if isinstance(existing, str):
            existing = {"fileId": existing}
        if existing and existing.get("fileId"):
            print(f"skip {lesson['id']} already uploaded")
            continue

        media_path = SOURCE_ROOT / lesson["videoFileName"]
        if not media_path.exists() or media_path.stat().st_size == 0:
            raise RuntimeError(f"Missing or empty video file: {media_path}")

        request = VodUploadRequest()
        request.MediaFilePath = str(media_path)
        request.MediaName = lesson["title"]
        request.MediaType = media_path.suffix.lstrip(".")
        request.ConcurrentUploadNumber = 4
        request.SourceContext = json.dumps({"courseId": course["id"], "lessonId": lesson["id"]})
        if sub_app_id:
            request.SubAppId = int(sub_app_id)
        if storage_region:
            request.StorageRegion = storage_region

        print(f"upload {lesson['id']} {media_path.name}")
        response = client.upload(region, request)
        vod_map[lesson["id"]] = {
            "fileId": response.FileId,
            "mediaUrl": getattr(response, "MediaUrl", None),
        }
        VOD_MAP.write_text(json.dumps(vod_map, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"done {lesson['id']} fileId={response.FileId}")

    print(f"wrote {VOD_MAP}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"upload failed: {exc}", file=sys.stderr)
        sys.exit(1)
