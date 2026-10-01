import React, { useState, useCallback } from 'react';
import { Play } from 'lucide-react';

/**
 * YoutubeFacade — a YouTube embed that does not load until it is clicked.
 *
 * A bare <iframe src="youtube.com/embed/..."> costs roughly 1.5-2.5MB on first
 * paint: the iframe document, the player JS, then the video segments. On a page
 * where the live stream sits far below the fold, all of that is downloaded and
 * parsed before the visitor ever scrolls to it, competing with the images that
 * are actually visible.
 *
 * The facade shows YouTube's own thumbnail (a ~20-40KB JPEG from i.ytimg.com)
 * with a play button, and only creates the iframe once the visitor asks for it.
 * The iframe is then mounted with autoplay, so the experience is unchanged.
 */

/** Thumbnail for a video id. hqdefault is the smallest reliable size. */
export const youtubeThumbnail = (videoId, quality = 'hqdefault') =>
  videoId ? `https://i.ytimg.com/vi/${videoId}/${quality}.jpg` : null;

/** Playlist cover fallback when there is no single video id. */
export const youtubePlaylistThumbnail = (playlistId) =>
  playlistId ? `https://i.ytimg.com/vi/${playlistId}/hqdefault.jpg` : null;

/**
 * @param {object} props
 * @param {string} [props.videoId]        single video id
 * @param {string} [props.playlistId]     playlist id (used when no videoId)
 * @param {string} props.embedUrl         the iframe src to mount on click
 * @param {string} [props.title]
 * @param {Function} [props.onLoaded]     called once the iframe reports load
 * @param {Function} [props.onError]
 * @param {string} [props.className]      wrapper
 * @param {boolean} [props.eager]         load the thumbnail eagerly (above fold)
 */
const YoutubeFacade = ({
  videoId,
  playlistId,
  embedUrl,
  title = 'YouTube video',
  onLoaded,
  onError,
  onActivate,
  className = '',
  eager = false,
}) => {
  const [activated, setActivated] = useState(false);

  const activate = useCallback(() => {
    setActivated(true);
    if (typeof onActivate === 'function') onActivate();
  }, [onActivate]);

  // Once activated the iframe owns the box; the thumbnail unmounts entirely.
  if (activated && embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={onLoaded}
        onError={onError}
        className={`w-full h-full ${className}`}
        style={{ border: 'none' }}
      />
    );
  }

  const thumb = youtubeThumbnail(videoId) || youtubePlaylistThumbnail(playlistId);

  return (
    <button
      type="button"
      onClick={activate}
      aria-label={`Play ${title}`}
      className={`relative w-full h-full overflow-hidden bg-black group ${
        onError ? '' : 'cursor-pointer'
      } ${className}`}
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          // The thumbnail is only a stand-in; the real content is the player.
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-maroon to-maroon-deep" />
      )}

      {/* Darken so the play button reads clearly over any thumbnail */}
      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors duration-300" />

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110">
          <Play size={26} className="fill-white text-white ml-1" />
        </span>
      </span>

      {/* YouTube attribution is required when showing their thumbnails */}
      <span className="absolute bottom-2 right-3 text-[10px] text-white/70">
        YouTube
      </span>
    </button>
  );
};

export default YoutubeFacade;