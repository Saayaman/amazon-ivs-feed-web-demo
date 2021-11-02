import React, { useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import throttle from "lodash.throttle";

import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Like from './like';
import { Play } from '../../assets/icons';

import useStream from '../../contexts/Stream/useStream';
import usePlayer from '../hooks/usePlayer';

import './Feed.css';

const Feed = ({ toggleMetadata }) => {
  const { activeStream, nextStream, prevStream, gotoNextStream, gotoPrevStream } =
    useStream();
  const [v1, v2, v3] = [useRef(1), useRef(2), useRef(3)];
  const playerWrapperRef = useRef();
  const players = [usePlayer(v1), usePlayer(v2), usePlayer(v3)];
  const loadedStreamsMap = useMemo(() => new Map(), []); // key: Player ID (PID), value: loaded stream
  const activePlayer =
    (!!activeStream &&
      !!loadedStreamsMap.size &&
      players.find(({ pid }) => loadedStreamsMap.get(pid)?.id === activeStream.id)) ||
    players[0];

  const init = useRef(true);

  const handleWheel = (e) => {
    playerWrapperRef.current.style.transition = "transform 650ms cubic-bezier(0.465, 0.183, 0.153, 0.946)";
    if(e.deltaY > 0) {
      console.log("next", e.deltaY);
      playerWrapperRef.current.style.transform = "translateY(-200%)";

      setTimeout(() => {
        gotoNextStream();
        playerWrapperRef.current.style.transition = "unset";
        if(!activePlayer.loading) {
          playerWrapperRef.current.style.transform = "translateY(-100%)";
        }
      }, 2000);
    } else {
      console.log("prev", e.deltaY);
      playerWrapperRef.current.style.transform = "translateY(0)";
      setTimeout(() => {
        gotoPrevStream();
        playerWrapperRef.current.style.transition = "unset";
        if(!activePlayer.loading) {
          playerWrapperRef.current.style.transform = "translateY(-100%)";
        }
      }, 2000);
    }
  }
  const onWheelThrottled = useMemo(() => throttle(handleWheel, 2000), []);

  useLayoutEffect(() => {
    if (activeStream && nextStream && prevStream) {
      const streams = [activeStream, nextStream, prevStream];

      // init: preload players with initial streams
      if (init.current) {
        players.forEach((player, i) => {
          const { id, stream } = streams[i];
          loadedStreamsMap.set(player.pid, { id, ...stream });
          player.preload(stream.playbackUrl);
        });

        players[0].instance.play();
        init.current = false;
        return;
      }

      // transition players to the next preloaded state
      if (loadedStreamsMap.size) {
        players.forEach((player) => {
          const { id: loadedStreamId } = loadedStreamsMap.get(player.pid);

          if (loadedStreamId === activeStream.id) {
            player.instance.play();
          } else if (
            loadedStreamId === nextStream.id ||
            loadedStreamId === prevStream.id
          ) {
            player.instance.pause();
          } else {
            const loadedStreamIds = [...loadedStreamsMap].map(([_, stream]) => stream.id);
            const { id, stream } = streams.find((s) => !loadedStreamIds.includes(s.id));
            player.preload(stream.playbackUrl);
            loadedStreamsMap.set(player.pid, { id, ...stream });
            if (id === activeStream.id) {
              player.instance.play();
            }
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

      <div ref={playerWrapperRef} onWheel={onWheelThrottled} className="player-video-wrapper">
        {players.map(({ pid, video, canvas }) => {
          let classN = "";
          if(loadedStreamsMap.size) {
            const { id: loadedStreamId } = loadedStreamsMap.get(pid);
            classN = pid === activePlayer.pid ? "currentStream" : loadedStreamId === nextStream.id ? "nextStream" : "prevStream";
          }
          const activeStyle = { display: pid === activePlayer.pid ? 'block' : 'none' };
          return (
            <div className={`player-video ${classN}`} key={pid}>
              <video ref={video} playsInline muted />;
              <canvas ref={canvas} style={activeStyle} />
            </div>
          );
        })}

        <Spinner loading={activePlayer.loading && !activePlayer.paused} />

        <button className="btn-pause" onClick={activePlayer.togglePlayPause} tabIndex={1}>
          {!activePlayer.loading && activePlayer.paused && <Play />}
        </button>
      </div>
    </div>
  );
};

export default Feed;
