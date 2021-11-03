import React, { useEffect, useRef, useMemo, useLayoutEffect } from 'react';

import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Like from './like';

import useStream from '../../contexts/Stream/useStream';
import usePlayer from '../hooks/usePlayer';

import './Feed.css';

const Feed = ({ toggleMetadata }) => {
  const { activeStream, nextStream, prevStream, gotoNextStream, gotoPrevStream } =
    useStream();
  const [v1, v2, v3] = [useRef(1), useRef(2), useRef(3)];
  const players = [usePlayer(v1), usePlayer(v2), usePlayer(v3)];
  const loadedStreamsMap = useMemo(() => new Map(), []); // key: Player ID (PID), value: loaded stream
  const activePlayer =
    (!!activeStream &&
      players.find(({ pid }) => loadedStreamsMap.get(pid)?.id === activeStream.id)) ||
    players[0];

  const init = useRef(true);
  useLayoutEffect(() => {
    if (activeStream && nextStream && prevStream) {
      const streams = [activeStream, nextStream, prevStream];

      // init: preload players with initial streams
      if (init.current) {
        players.forEach((player, i) => {
          const { id, stream } = streams[i];
          const isStreamActive = id === activeStream.id;
          player.preload(stream.playbackUrl, isStreamActive);
          loadedStreamsMap.set(player.pid, { id, ...stream });
        });

        init.current = false;
        return;
      }

      // transition players to the next preloaded state
      if (loadedStreamsMap.size) {
        players.forEach((player) => {
          const { id: loadedStreamId } = loadedStreamsMap.get(player.pid);
          const isLoaded = (stream) => loadedStreamId === stream.id;

          if (isLoaded(activeStream)) {
            player.setABR(true);
            player.instance.play();
          } else if (isLoaded(nextStream) || isLoaded(prevStream)) {
            player.instance.pause();
            player.setABR(false);
          } else {
            const loadedStreamIds = [...loadedStreamsMap].map(([_, stream]) => stream.id);
            const { id, stream } = streams.find((s) => !loadedStreamIds.includes(s.id));
            const isStreamActive = id === activeStream.id;
            player.preload(stream.playbackUrl, isStreamActive);
            loadedStreamsMap.set(player.pid, { id, ...stream });
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStream]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 38) gotoPrevStream(); // keyCode 38 : 'ArrowUp'
      if (e.keyCode === 40) gotoNextStream(); // keyCode 38 : 'ArrowDown'
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gotoNextStream, gotoPrevStream]);

  if (!window.IVSPlayer.isPlayerSupported) {
    console.warn('The current browser does not support the Amazon IVS player.');
    return null;
  }

  return (
    <div className="feed-content">
      <div className="player-buttons">
        <Like />
        <Button onClick={activePlayer.toggleMute}>
          {activePlayer.muted ? 'VolumeOff' : 'VolumeUp'}
        </Button>

        <hr className="divider" />
        <Button onClick={gotoPrevStream}>ChevronUp</Button>
        <Button onClick={gotoNextStream}>ChevronDown</Button>

        <span className="metadata-toggle">
          <hr className="divider" />
          <Button onClick={() => toggleMetadata()}>Description</Button>
        </span>
      </div>

      <div className="player-video">
        {players.map(({ pid, video, canvas }) => {
          const { PlayerState } = window.IVSPlayer;
          const currentState = activePlayer.instance?.getState();

          const isPlayerVisible = pid === activePlayer.pid;
          const isCanvasVisible = isPlayerVisible && currentState !== PlayerState.READY;

          const playerStyle = { display: isPlayerVisible ? 'block' : 'none' };
          const canvasStyle = { display: isCanvasVisible ? 'block' : 'none' };

          return (
            <React.Fragment key={pid}>
              <video ref={video} style={playerStyle} playsInline muted />
              <canvas ref={canvas} style={canvasStyle} />
            </React.Fragment>
          );
        })}

        <Spinner loading={activePlayer.loading && !activePlayer.paused} />

        <button className="btn-pause" onClick={activePlayer.togglePlayPause} tabIndex={1}>
          {!activePlayer.loading && activePlayer.paused && <Button>Play</Button>}
        </button>
      </div>
    </div>
  );
};

export default Feed;
