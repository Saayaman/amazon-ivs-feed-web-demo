import { useEffect, useState, useRef, useCallback } from 'react';
import 'context-filter-polyfill';

const { isPlayerSupported, create, PlayerState, PlayerEventType } = window.IVSPlayer;

const usePlayer = (video) => {
  const player = useRef(null);
  const pid = useRef(video.current);
  const canvas = useRef();
  const startPlaybackAfterLoad = useRef(false);

  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);

  // Temporary
  const log = (message) => {
    console.log(`Player ${pid.current}: ${message}`);
  };

  const setABR = useCallback((enable) => {
    log('setABR Triggered');

    const isAbrEnabled = player.current.isAutoQualityMode();
    const lowestQuality = player.current.getQualities().pop();
    const currentQuality = player.current.getQuality();

    if (enable && !isAbrEnabled) {
      // Enable the Adaptive Bitrate (ABR) streaming algorithm
      player.current.setAutoQualityMode(true);

      player.current.isAutoQualityMode() && log('ABR Enabled');
    }

    if (!enable && (isAbrEnabled || currentQuality.name !== lowestQuality?.name)) {
      // Disable the Adaptive Bitrate (ABR) streaming algorithm
      if (lowestQuality) {
        player.current.setQuality(lowestQuality, false);

        log(`ABR Disabled with Lowest Quality: ${lowestQuality.name}`);
      } else {
        player.current.setAutoQualityMode(false);

        log('ABR Disabled');
      }
    }
  }, []);

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

      log(`useEffect - currentState = ${currentState}`);

      const renderBlur = () => {
        const can = canvas.current;
        const ctx = can.getContext('2d');
        ctx.filter = 'blur(3px)';

        const draw = () => {
          if (can && player.current.getState() !== READY) {
            ctx.drawImage(video.current, 0, 0, can.width, can.height);
            requestAnimationFrame(draw);
          } else return;
        };
        requestAnimationFrame(draw);
      };

      const onStateChange = () => {
        const newState = player.current.getState();
        setLoading(newState !== PLAYING);
        setPaused(player.current.isPaused());
        if (newState === PLAYING) {
          renderBlur();
        }
        console.log(`Player ${pid.current} State - ${newState}`);
      };

      const onError = (err) => {
        console.warn(`Player ${pid.current} Event - ERROR:`, err);
      };

      if (isPlayerInitialized && !player.current.core.isLoaded) {
        log(
          `Loading with stream ${streamUrl} - startPlaybackAfterLoad: ${startPlaybackAfterLoad.current}`
        );
        player.current.load(streamUrl);
      } else {
        log('CREATING New Player');
        video.current.removeAttribute('src'); // empty video source
        video.current.crossOrigin = 'anonymous';

        player.current = create();
        player.current.attachHTMLVideoElement(video.current);
        if (streamUrl) {
          log(`Loading newly created Player with stream ${streamUrl}`);
          player.current.load(streamUrl);
        }

        player.current.addEventListener(READY, onStateChange);
        player.current.addEventListener(PLAYING, onStateChange);
        player.current.addEventListener(BUFFERING, onStateChange);
        player.current.addEventListener(ENDED, onStateChange);
        player.current.addEventListener(ERROR, onError);
      }

      if (startPlaybackAfterLoad.current) {
        log('usePlayer - Enabling ABR and Playing...');
        player.current.play();
      } else {
        log('usePlayer - Pausing and Disabling ABR...');
        player.current.pause();
      }
      setABR(startPlaybackAfterLoad.current);
      startPlaybackAfterLoad.current = false;

      return () => {
        if (player.current.core.isLoaded) {
          log('TEARDOWN - Removing event listeners and deleting Player instance');
          player.current?.removeEventListener(READY, onStateChange);
          player.current?.removeEventListener(PLAYING, onStateChange);
          player.current?.removeEventListener(BUFFERING, onStateChange);
          player.current?.removeEventListener(ENDED, onStateChange);
          player.current?.removeEventListener(ERROR, onError);
          player.current.delete();
        }
      };
    }
  }, [video, streamUrl, setABR]);

  const preload = (playbackUrl, startPlayback = false) => {
    log(`Preloading... (Setting streamUrl state) - startPlayback = ${startPlayback}`);
    setStreamUrl(playbackUrl);
    startPlaybackAfterLoad.current = startPlayback;
  };

  const toggleMute = () => {
    const muteNext = !player.current.isMuted();
    player.current.setMuted(muteNext);
    setMuted(muteNext);
  };

  const togglePlayPause = () => {
    if (player.current.isPaused()) {
      console.log('toggle play');
      player.current.play();
    } else {
      console.log('toggle pause');
      player.current.pause();
    }
    setPaused(player.current.isPaused());
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
    canvas,
    log
  };
};

export default usePlayer;
