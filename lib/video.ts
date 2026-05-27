export function getYouTubeId(url?: string | null) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop() || null
    }
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.split('/').filter(Boolean)[0] || null
    }
  } catch {
    return null
  }

  return null
}

export function getVideoEmbedUrl(video: {
  videoProvider?: string | null
  youtubeVideoId?: string | null
  tencentVodFileId?: string | null
  videoUrl?: string | null
}) {
  if (video.videoProvider === 'youtube' || video.youtubeVideoId || getYouTubeId(video.videoUrl)) {
    const id = video.youtubeVideoId || getYouTubeId(video.videoUrl)
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : null
  }

  if (video.videoProvider === 'tencent-vod' && video.tencentVodFileId) {
    return null
  }

  return null
}

export function getVideoSourceLabel(video: {
  videoProvider?: string | null
  youtubeVideoId?: string | null
  tencentVodFileId?: string | null
  videoUrl?: string | null
}) {
  if (video.videoProvider === 'tencent-vod' || video.tencentVodFileId) return 'Tencent VOD'
  if (video.videoProvider === 'youtube' || video.youtubeVideoId || getYouTubeId(video.videoUrl)) return 'YouTube'
  if (video.videoUrl) return 'External video'
  return 'Video coming soon'
}
