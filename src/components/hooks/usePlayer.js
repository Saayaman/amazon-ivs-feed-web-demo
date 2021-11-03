import { useEffect, useState, useRef } from 'react';
import 'context-filter-polyfill';

const { isPlayerSupported, create, PlayerState, PlayerEventType } = window.IVSPlayer;

const usePlayer = (video) => {
  const player = useRef(null);
  const pid = useRef(video.current);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const canvas = useRef();

  // handle case when autoplay with sound is blocked by browser
  useEffect(() => {
    if (loading || !player.current) return;
    setMuted(player.current.isMuted());
  }, [loading]);

  useEffect(() => {
    if (isPlayerSupported) {
      const { ENDED, PLAYING, READY, BUFFERING } = PlayerState;
      const { ERROR } = PlayerEventType;
      const isPlayerInitialized = !!player.current?.core;
      const currentState = isPlayerInitialized && player.current.getState();

      const renderBlur = () => {
        const can = canvas.current;
        const ctx = can.getContext('2d');
        ctx.filter = 'blur(3px)';

        const draw = () => {
          if (canvas.current) {
            ctx.drawImage(video.current, 0, 0, can.width, can.height);
            requestAnimationFrame(draw);
          }
        };

        requestAnimationFrame(draw);
      };

      const onStateChange = () => {
        const newState = player.current.getState();
        setABR(newState !== READY);
        setLoading(newState !== PLAYING);
        setPaused(player.current.isPaused());

        if (newState !== READY) {
          renderBlur();
        }

        console.log(`Player ${pid.current} State - ${newState}`);
      };

      const onError = (err) => {
        console.warn(`Player ${pid.current} Event - ERROR:`, err);
      };

      if (isPlayerInitialized && currentState !== PlayerState.READY) {
        player.current.load(streamUrl);
      } else {
        console.log(`Creating Player ${pid.current}`);
        video.current.removeAttribute('src'); // empty video source
        video.current.crossOrigin = 'anonymous';

        player.current = create();
        player.current.attachHTMLVideoElement(video.current);
        if (streamUrl) {
          player.current.load(streamUrl);
        }

        player.current.addEventListener(READY, onStateChange);
        player.current.addEventListener(PLAYING, onStateChange);
        player.current.addEventListener(BUFFERING, onStateChange);
        player.current.addEventListener(ENDED, onStateChange);
        player.current.addEventListener(ERROR, onError);
      }

      return () => {
        if (player.current?.getState() === PlayerState.READY) {
          player.current?.removeEventListener(READY, onStateChange);
          player.current?.removeEventListener(PLAYING, onStateChange);
          player.current?.removeEventListener(BUFFERING, onStateChange);
          player.current?.removeEventListener(ENDED, onStateChange);
          player.current?.removeEventListener(ERROR, onError);
          player.current.delete();
        }
      };
    }
  }, [video, streamUrl]);

  const preload = (playbackUrl, startPlayback = false) => {
    setStreamUrl(playbackUrl);

    if (startPlayback) {
      setABR(true);
      player.current.play();
    } else {
      player.current.pause();
      setABR(false);
    }
  };

  const toggleMute = () => {
    const muteNext = !player.current.isMuted();
    player.current.setMuted(muteNext);
    setMuted(muteNext);
  };

  const togglePlayPause = () => {
    if (player.current.isPaused()) {
      player.current.play();
    } else {
      player.current.pause();
    }
    setPaused(player.current.isPaused());
  };

  const setABR = (enable) => {
    const isAbrEnabled = player.current.isAutoQualityMode();
    const lowestQuality = player.current.getQualities().pop();
    const currentQuality = player.current.getQuality();

    if (enable && !isAbrEnabled) {
      // Enable the Adaptive Bitrate (ABR) streaming algorithm
      player.current.setAutoQualityMode(true);
      console.log(
        player.current.isAutoQualityMode() && `Player ${pid.current} ABR Enabled`
      );
    }

    if (!enable && (isAbrEnabled || currentQuality.name !== lowestQuality?.name)) {
      // Disable the Adaptive Bitrate (ABR) streaming algorithm
      // - if player is in READY state, then qualities must be available
      // and the lowest quality is set. Otherwise, ABR is simply disabled.
      if (lowestQuality) {
        player.current.setQuality(lowestQuality, false);
        console.log(
          !player.current.isAutoQualityMode() &&
            `Player ${pid.current} ABR Disabled with Lowest Quality: ${lowestQuality}`
        );
      } else {
        player.current.setAutoQualityMode(false);
        console.log(
          !player.current.isAutoQualityMode() && `Player ${pid.current} ABR Disabled`
        );
      }
    }
  };

  return {
    instance: player.current,
    pid: pid.current,
    togglePlayPause,
    toggleMute,
    setABR,
    loading,
    paused,
    muted,
    preload,
    video,
    canvas
  };
};

export default usePlayer;
