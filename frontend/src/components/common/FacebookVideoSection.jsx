import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  extractFacebookVideoUrl,
  resolveFacebookVideoUrl,
  buildFacebookEmbedSrc,
  isYouTubeUrl,
  buildYouTubeEmbedSrc,
} from '../../utils/facebookVideo';

const REELS_PAGE_SIZE = 12;

/* ============================================================
   SLIDER ARROW
============================================================ */
function SliderArrow({ direction = 'right', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous' : 'Next'}
      className="
        absolute top-1/2 -translate-y-1/2 z-20
        w-11 h-11 rounded-full
        bg-white shadow-xl shadow-black/10 border border-gray-100
        flex items-center justify-center
        text-gray-600
        hover:bg-gradient-to-br hover:from-rose-500 hover:to-red-600 hover:text-white hover:border-transparent
        transition-all duration-200
      "
      style={{
        [direction === 'left' ? 'left' : 'right']: '10px',
      }}
    >
      <span className="text-2xl leading-none">
        {direction === 'left' ? '‹' : '›'}
      </span>
    </button>
  );
}

/* ============================================================
   CLEAN VIDEO URL HOOK
============================================================ */
function useCleanVideoUrl(url) {
  const [cleanUrl, setCleanUrl] = useState('');

  useEffect(() => {
    let active = true;

    const loadUrl = async () => {
      const clean = extractFacebookVideoUrl(url);

      if (!clean) {
        if (active) setCleanUrl('');
        return;
      }

      setCleanUrl(clean);

      const needsResolve =
        /facebook\.com\/share\//i.test(clean) ||
        /(^|\.)fb\.watch\//i.test(clean);

      if (needsResolve) {
        try {
          const resolved = await resolveFacebookVideoUrl(clean);

          if (active) {
            setCleanUrl(resolved || clean);
          }
        } catch {
          if (active) {
            setCleanUrl(clean);
          }
        }
      }
    };

    loadUrl();

    return () => {
      active = false;
    };
  }, [url]);

  return cleanUrl;
}

/* ============================================================
   VIDEO POPUP MODAL
   - Autoplays with SOUND as soon as the modal opens
   - When the modal is hidden/unmounted the iframe is destroyed,
     which stops both video playback and sound.
============================================================ */
function VideoPopupModal({ video, total, onClose, onPrev, onNext }) {
  const cleanUrl = useCleanVideoUrl(video?.url || '');
  const isYT = isYouTubeUrl(cleanUrl);

  // Autoplay with sound: auto=true, muted=false
  const embedSrc = cleanUrl
    ? isYT
      ? buildYouTubeEmbedSrc(cleanUrl, true, false)
      : buildFacebookEmbedSrc(cleanUrl, true, false)
    : '';

  // Lock body scroll while the modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 video-modal-backdrop"
      onClick={onClose}
    >
      {/* Controls - Prev / Next / Close (glass style) */}
      {onPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous"
          className="
            video-modal-nav absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-30
            w-11 h-11 sm:w-12 sm:h-12 rounded-full
            bg-white/10 border border-white/20 backdrop-blur-md
            flex items-center justify-center text-white/90
            hover:bg-gradient-to-br hover:from-rose-500 hover:to-red-600 hover:border-transparent
            active:scale-95 transition-all duration-200
            shadow-lg shadow-black/20
          "
        >
          <span className="text-2xl leading-none">‹</span>
        </button>
      )}

      {onNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next"
          className="
            video-modal-nav absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-30
            w-11 h-11 sm:w-12 sm:h-12 rounded-full
            bg-white/10 border border-white/20 backdrop-blur-md
            flex items-center justify-center text-white/90
            hover:bg-gradient-to-br hover:from-rose-500 hover:to-red-600 hover:border-transparent
            active:scale-95 transition-all duration-200
            shadow-lg shadow-black/20
          "
        >
          <span className="text-2xl leading-none">›</span>
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="
          absolute top-4 right-4 sm:top-5 sm:right-5 z-30
          w-11 h-11 rounded-full
          bg-white/10 border border-white/20 backdrop-blur-md
          flex items-center justify-center
          text-white/90 hover:bg-white/20 hover:rotate-90
          active:scale-95 transition-all duration-300
        "
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-lg video-modal-overlay"
        onClick={onClose}
      />

      {/* Player Card */}
      <div
        className={`relative z-10 video-modal-card ${video.reel ? 'w-auto' : 'w-full max-w-4xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="
            relative bg-black overflow-hidden
            rounded-2xl sm:rounded-3xl
            ring-1 ring-white/15
            shadow-2xl shadow-black/60
          "
          style={
            video.reel
              ? {
                  aspectRatio: '9 / 16',
                  height: 'min(80vh, 640px)',
                  width: 'auto',
                  maxWidth: '92vw',
                }
              : {
                  aspectRatio: '16 / 9',
                  width: '100%',
                  maxHeight: '78vh',
                }
          }
        >
          {embedSrc ? (
            <iframe
              key={embedSrc}
              src={embedSrc}
              title={video.reel ? 'Facebook Reel' : 'Facebook Video'}
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none', overflow: 'hidden' }}
              scrolling="no"
              frameBorder="0"
              allow="
                autoplay;
                automaticPicrtureInPicture;
                clipboard-write;
                encrypted-media;
                picture-in-picture;
                web-share
              "
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
              Loading video...
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-widest">
              {video.reel ? 'Reel' : 'Video'}
            </span>
            {total > 1 && (
              <span className="text-white/70 text-xs font-medium drop-shadow">
                {video.index != null ? video.index + 1 : ''} / {total}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SINGLE FACEBOOK VIDEO CARD
============================================================ */
function FacebookVideoCard({
  url,
  reel = false,
  onPlay,
}) {
  const [cleanUrl, setCleanUrl] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadVideoUrl = async () => {
      const clean = extractFacebookVideoUrl(url);

      if (!clean) {
        if (active) {
          setCleanUrl('');
          setLoaded(false);
        }
        return;
      }

      if (active) {
        setCleanUrl(clean);
        setLoaded(true);
      }

      const needsResolve =
        /facebook\.com\/share\//i.test(clean) ||
        /(^|\.)fb\.watch\//i.test(clean);

      if (needsResolve) {
        try {
          const resolved = await resolveFacebookVideoUrl(clean);

          if (active) {
            setCleanUrl(resolved || clean);
          }
        } catch {
          if (active) {
            setCleanUrl(clean);
          }
        }
      }
    };

    loadVideoUrl();

    return () => {
      active = false;
    };
  }, [url]);

  const isYT = isYouTubeUrl(cleanUrl);

  /*
   * IMPORTANT:
   * Do not use a fake image/thumbnail here.
   * Facebook itself provides the video preview.
   */
  const embedSrc =
    loaded && cleanUrl
      ? isYT
        ? buildYouTubeEmbedSrc(cleanUrl, false)
        : buildFacebookEmbedSrc(cleanUrl, false)
      : '';

  const handlePlay = () => {
    if (typeof onPlay === 'function') {
      onPlay();
    }
  };

  return (
    <div
      className="
        relative
        w-full
        overflow-hidden
        rounded-2xl
        bg-black
        shadow-lg
        ring-1 ring-gray-200/80
        group cursor-pointer
        transition-transform duration-300
        hover:-translate-y-1 hover:shadow-2xl hover:ring-rose-300
        ${reel ? 'your-video-container' : ''}
      "
      onClick={handlePlay}
    >
      <div
        className="relative w-full bg-black"
        style={{
          aspectRatio: reel ? '9 / 16' : '16 / 9',
        }}
      >
        {embedSrc ? (
          <iframe
            key={embedSrc}
            src={embedSrc}
            title={reel ? 'Facebook Reel' : 'Facebook Video'}
            className="
              absolute
              inset-0
              w-full
              h-full
              block
            "
            style={{
              border: 'none',
              background: '#000',
              pointerEvents: 'none',
            }}
            scrolling="no"
            frameBorder="0"
            allow="
              automaticPicrtureInPicture;
              clipboard-write;
              encrypted-media;
              picture-in-picture;
              web-share
            "
            allowFullScreen
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white/70 text-sm">
              Loading video...
            </div>
          </div>
        )}

        {/* Slight tint to quiet the Facebook embed's own controls (not interactive) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.12)' }}
        />

        {/* Play overlay: shown on hover for regular videos, hidden for modern reels */}
        {!reel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="
                w-14 h-14 rounded-full
                bg-white/95 backdrop-blur-sm
                flex items-center justify-center
                shadow-xl
                opacity-0 group-hover:opacity-100
                transition-all duration-300
                scale-75 group-hover:scale-100
              "
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="translate-x-0.5">
                <path d="M8 5v14l11-7z" fill="#e11d48" />
              </svg>
            </div>
          </div>
        )}

        {/* Reels: no play/pause icons - a subtle hover shade is the only signal */}
        {reel && (
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'rgba(0,0,0,0.25)' }}
          />
        )}

        {/* Bottom gradient for depth */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)" }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   MAIN FACEBOOK VIDEO SECTION
============================================================ */
function FacebookVideoSection({
  settings,
  t,
  showViewMoreReels = true,
  containerClass = '',
  onlyReels = false,
  hideReels = false,
}) {
  const navigate = useNavigate();

  const videoSliderRef = useRef(null);
  const reelSliderRef = useRef(null);

  /*
   * Active in-modal video.
   * activeVideo = { url, reel, index } | null
   * When null the modal is unmounted (playback + sound stop).
   */
  const [activeVideo, setActiveVideo] = useState(null);

  const closePlayer = () => setActiveVideo(null);

  const stepPlayer = (dir) => {
    if (!activeVideo) return;
    if (activeVideo.reel) {
      const idx = visibleReels.indexOf(activeVideo.url);
      const next = (idx + dir + visibleReels.length) % visibleReels.length;
      setActiveVideo({ url: visibleReels[next], reel: true, index: next });
    } else {
      const idx = videos.indexOf(activeVideo.url);
      const next = (idx + dir + videos.length) % videos.length;
      setActiveVideo({ url: videos[next], reel: false, index: next });
    }
  };

  const prevInline = () => stepPlayer(-1);
  const nextInline = () => stepPlayer(1);

  /* ==========================================================
     SETTINGS
  ========================================================== */

  const fbEnabled =
    settings?.facebookVideo?.enabled !== false;

  const videos = Array.isArray(settings?.facebookVideos)
    ? settings.facebookVideos
        .filter((item) => item?.enabled !== false)
        .map((item) => item?.url)
        .filter(Boolean)
    : [];

  const reels = Array.isArray(settings?.facebookReels)
    ? settings.facebookReels
        .filter((item) => item?.enabled !== false)
        .map((item) => item?.url)
        .filter(Boolean)
    : [];

  const visibleReels = reels.slice(0, REELS_PAGE_SIZE);

  const hasMoreReels =
    reels.length > REELS_PAGE_SIZE;

  /* ==========================================================
     SLIDER FUNCTIONS
  ========================================================== */

  const scrollSlider = (ref, direction, amount) => {
    if (!ref.current) return;

    ref.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const goToGalleryVideos = () => {
    navigate('/gallery?tab=videos');
  };

  /*
   * Do NOT return before hooks.
   * All hooks are already declared above.
   */
  if (!fbEnabled) {
    return null;
  }

  if (videos.length === 0 && reels.length === 0) {
    return null;
  }

  return (
    <>
      <div className={containerClass}>

        {/* ======================================================
            FACEBOOK VIDEOS
        ====================================================== */}

        {!onlyReels && videos.length > 0 && (
          <section className="mb-20">

            <div className="flex flex-col items-center mb-10">
              <h2
                className="
                  font-serif
                  text-3xl
                  sm:text-4xl
                  md:text-5xl
                  text-center
                  tracking-tight
                "
                style={{ color: '#7A0000' }}
              >
                {t?.facebookVideoTitle || 'Watch on Facebook'}
              </h2>
            </div>

            <div className="relative">

              <SliderArrow
                direction="left"
                onClick={() =>
                  scrollSlider(
                    videoSliderRef,
                    'left',
                    430
                  )
                }
              />

              <SliderArrow
                direction="right"
                onClick={() =>
                  scrollSlider(
                    videoSliderRef,
                    'right',
                    430
                  )
                }
              />

              <div
                ref={videoSliderRef}
                className="
                  flex
                  gap-5
                  overflow-x-auto
                  scroll-smooth
                  snap-x
                  snap-mandatory
                  scrollbar-hide
                  px-1
                  pb-3
                "
                style={{
                  scrollbarWidth: 'none',
                }}
              >
                {videos.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="
                      flex-shrink-0
                      snap-start
                      w-[320px]
                      sm:w-[380px]
                      lg:w-[420px]
                    "
                  >
                    <FacebookVideoCard
                      url={url}
                      reel={false}
                      onPlay={() =>
                        setActiveVideo({ url, reel: false, index })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ======================================================
            REELS
        ====================================================== */}

        {!hideReels && reels.length > 0 && (
          <section>

            <div className="flex flex-col items-center mb-4">
              <h2
                className="
                  font-serif
                  text-3xl
                  sm:text-4xl
                  md:text-5xl
                  text-center
                  tracking-tight
                "
                style={{ color: '#7A0000' }}
              >
                {t?.facebookReelsTitle ||
                  'Reels & Short Videos'}
              </h2>
            </div>

            <div className="relative">

              <SliderArrow
                direction="left"
                onClick={() =>
                  scrollSlider(
                    reelSliderRef,
                    'left',
                    280
                  )
                }
              />

              <SliderArrow
                direction="right"
                onClick={() =>
                  scrollSlider(
                    reelSliderRef,
                    'right',
                    280
                  )
                }
              />

              <div
                ref={reelSliderRef}
                className="
                  flex
                  gap-5
                  overflow-x-auto
                  scroll-smooth
                  snap-x
                  snap-mandatory
                  scrollbar-hide
                  px-1
                  pb-3
                "
                style={{
                  scrollbarWidth: 'none',
                }}
              >
                {visibleReels.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="
                      flex-shrink-0
                      snap-start
                      w-[220px]
                      sm:w-[240px]
                      lg:w-[250px]
                    "
                  >
                    <FacebookVideoCard
                      url={url}
                      reel
                      onPlay={() =>
                        setActiveVideo({ url, reel: true, index })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ==================================================
                VIEW MORE
            ================================================== */}

            {hasMoreReels &&
              showViewMoreReels && (
                <div className="flex justify-center mt-10">

                  <button
                    type="button"
                    onClick={goToGalleryVideos}
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-7
                      py-3
                      rounded-full
                      text-sm
                      font-semibold
                      text-white
                      bg-gradient-to-r from-rose-500 to-red-600
                      shadow-lg shadow-rose-500/30
                      transition-all
                      duration-200
                      hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/40
                    "
                  >
                    {t?.viewMoreReels ||
                      'View More Reels'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>

                </div>
              )}
          </section>
        )}
      </div>

      {/* ==================================================
          POPUP VIDEO MODAL  (autoplay with sound)
      ================================================== */}
      {activeVideo && (
        <VideoPopupModal
          video={activeVideo}
          total={activeVideo.reel ? visibleReels.length : videos.length}
          onClose={closePlayer}
          onPrev={prevInline}
          onNext={nextInline}
        />
      )}

      <style>{`
        @keyframes videoModalBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes videoModalCardIn {
          from { opacity: 0; transform: scale(0.92) translateY(18px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes videoModalNavIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-14px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes videoModalNavInRight {
          from { opacity: 0; transform: translateY(-50%) translateX(14px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        .video-modal-backdrop { animation: videoModalBackdropIn 0.25s ease-out forwards; }
        .video-modal-overlay { animation: videoModalBackdropIn 0.3s ease-out forwards; }
        .video-modal-card { animation: videoModalCardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .video-modal-nav { animation: videoModalNavIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .video-modal-nav + .video-modal-nav { animation-name: videoModalNavInRight; }
      `}</style>
    </>
  );
}

export default FacebookVideoSection;