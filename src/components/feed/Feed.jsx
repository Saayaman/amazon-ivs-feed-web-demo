import React, { useEffect, useRef, useMemo, useLayoutEffect, useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import throttle from 'lodash.throttle';

import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Like from './like';
import { Play } from '../../assets/icons';

import useStream from '../../contexts/Stream/useStream';
import usePlayer from '../hooks/usePlayer';

import './Feed.css';

const Feed = ({ toggleMetadata }) => {
  const history = useHistory();
  const { activeStream, nextStream, prevStream, gotoNextStream, gotoPrevStream, streams } =
    useStream();
  const [v1, v2, v3] = [useRef(1), useRef(2), useRef(3)];
  const players = [usePlayer(v1), usePlayer(v2), usePlayer(v3)];
  const loadedStreamsMap = useMemo(() => new Map(), []); // key: Player ID (PID), value: loaded stream
  const activePlayer =
    (!!activeStream &&
      !!loadedStreamsMap.size &&
      players.find(({ pid }) => loadedStreamsMap.get(pid)?.id === activeStream.id)) ||
    players[0];
  const [wheelExecuting, setWheelExecuting] = useState(false);
  const [path, setPath] = useState(null);

  const init = useRef(true);

  console.log("activeStream", activeStream);

  const handleWheel = (e) => {
    if(!wheelExecuting) {
      
      history.push({ pathname: `/${e.deltaY > 0 ? nextStream.id : prevStream.id}`})
      setWheelExecuting(true);
      setPath(`/${e.deltaY > 0 ? nextStream.id : prevStream.id}`);
      // history.go(0);
    }
  } 

  const onWheelThrottled = useMemo(() => throttle(handleWheel, 300), [streams]);

  useEffect(() => {
    // console.log("wheelExecute", wheelExecuting);
    // console.log("path", path);
    // setWheelExecuting(false);
    // setPath(null);
    return () => {
      setWheelExecuting(false);
      setPath(null);
    }
  }, [activeStream])

  useLayoutEffect(() => {
    if (activeStream && nextStream && prevStream) {
      const streams = [activeStream, nextStream, prevStream];

      // init: preload players with initial streams
      if (init.current && players) {
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

  // if (wheelExecuting && path) {
  //   console.log("path", path);
  //   return <Redirect to='/5' />
  // }

  if(!activePlayer && !players) {
    return (
      <Spinner loading={activePlayer.loading && !activePlayer.paused} />
    )
  }

  return (
    <div className="feed-content">
      <div className="player-buttons">
        <Like />
        <Button onClick={activePlayer.toggleMute}>
          {activePlayer.muted ? 'VolumeOff' : 'VolumeUp'}
        </Button>

        <hr className="divider" />
        {/* <Button onClick={gotoPrevStream}>ChevronUp</Button>
        <Button onClick={gotoNextStream}>ChevronDown</Button> */}
        {nextStream && prevStream && (
          <>
            <Button link={`/${prevStream.id}`}>ChevronUp</Button>
            <Button link={`/${nextStream.id}`}>ChevronDown</Button>
          </>
        )}

        <span className="metadata-toggle">
          <hr className="divider" />
          <Button onClick={() => toggleMetadata()}>Description</Button>
        </span>
      </div>

      <div className="player-video" onWheel={onWheelThrottled}>
        {players.map(({ pid, video, canvas }) => {
          const style = { display: pid === activePlayer.pid ? 'block' : 'none' };
          return (
            <React.Fragment key={pid}>
              <video ref={video} style={style} playsInline muted />;
              <canvas ref={canvas} style={style} />
            </React.Fragment>
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
