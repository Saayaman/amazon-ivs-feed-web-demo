import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react';
import { Navigation, Keyboard, Mousewheel } from 'swiper';

import Player from './Player';
import PlayerControls from './Player/PlayerControls';
import useStream from '../../contexts/Stream/useStream';
import config from '../../config';

import './Feed.css';

const PLAYER_TYPES = Object.freeze({ ACTIVE: 'ACTIVE', NEXT: 'NEXT', PREV: 'PREV' });
const { SWIPE_DURATION } = config;

const Feed = ({ toggleMetadata }) => {
  const { activeStream, throttledGotoNextStream, throttledGotoPrevStream } = useStream();
  const [playersData, setPlayersData] = useState([
    { playbackUrl: '', type: PLAYER_TYPES.ACTIVE },
    { playbackUrl: '', type: PLAYER_TYPES.NEXT },
    { playbackUrl: '', type: PLAYER_TYPES.PREV }
  ]);
  const navBtns = useRef();
  const swipeDirection = useRef(null);
  const [activePlayer, setActivePlayer] = useState(null);

  useEffect(() => {
    if (activeStream) {
      const [activePlaybackUrl, nextPlaybackUrl, prevPlaybackUrl] = [
        activeStream,
        activeStream.next,
        activeStream.prev
      ].map(({ data }) => data.stream.playbackUrl);

      let newPlayersData = [...playersData];

      if (swipeDirection.current === 'next') {
        newPlayersData.unshift(newPlayersData.pop()); // shift playersData down
      } else if (swipeDirection.current === 'prev') {
        newPlayersData.push(newPlayersData.shift()); // shift playersData up
      }

      newPlayersData = newPlayersData.map((player) => {
        switch (player.type) {
          case PLAYER_TYPES.ACTIVE:
            return { ...player, playbackUrl: activePlaybackUrl };
          case PLAYER_TYPES.NEXT:
            return { ...player, playbackUrl: nextPlaybackUrl };
          case PLAYER_TYPES.PREV:
            return { ...player, playbackUrl: prevPlaybackUrl };
          default:
            return player;
        }
      });

      setPlayersData(newPlayersData);
      swipeDirection.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStream]);

  const setSwipeDirection = (swiper, event) => {
    if (!swipeDirection.current) {
      if (
        (swiper && swiper.swipeDirection === 'next') || // Touch: swipe up
        event?.wheelDeltaY < 0 || // MouseWheel: vertical scroll up
        event === 40 || // Keyboard: ArrowDown (keyCode 40)
        event === 34 || // Keyboard: PageDown (keyCode 34)
        event === 'next' // Other: direct swipe direction set (i.e. next nav. button)
      ) {
        swipeDirection.current = 'next';
      } else if (
        (swiper && swiper.swipeDirection === 'prev') || // Touch: swipe down
        event?.wheelDeltaY > 0 || // MouseWheel: vertical scroll down
        event === 38 || // Keyboard: ArrowUp (keyCode 38)
        event === 33 || // Keyboard: PageUp (keyCode 33)
        event === 'prev' // Other: direct swipe direction set (i.e. prev nav. button)
      ) {
        swipeDirection.current = 'prev';
      }
    } else swipeDirection.current = null;
  };

  const gotoStream = () => {
    if (swipeDirection.current === 'next') throttledGotoNextStream();
    if (swipeDirection.current === 'prev') throttledGotoPrevStream();
  };

  if (!window.IVSPlayer.isPlayerSupported) {
    console.warn('The current browser does not support the Amazon IVS player.');
    return null;
  }

  return (
    !!activeStream &&
    playersData.every(({ playbackUrl }) => !!playbackUrl) && (
      <div className="feed-content">
        <PlayerControls
          ref={navBtns}
          player={activePlayer}
          toggleMetadata={toggleMetadata}
          setSwipeDirection={(dir) => setSwipeDirection(null, dir)}
        />
        <Swiper
          /* swiper config */
          loop
          watchSlidesProgress
          simulateTouch={false}
          direction={'vertical'}
          speed={SWIPE_DURATION}
          preventInteractionOnTransition
          /* slide switching modules config */
          modules={[Keyboard, Navigation, Mousewheel]}
          keyboard
          navigation={{
            prevEl: '#prev-stream',
            nextEl: '#next-stream'
          }}
          mousewheel={{ forceToAxis: true, thresholdTime: 750, thresholdDelta: 75 }}
          onInit={(swiper) => {
            setTimeout(() => {
              swiper.params.navigation.nextEl = navBtns.current.nextBtn;
              swiper.params.navigation.prevEl = navBtns.current.prevBtn;
              swiper.navigation.init();
              swiper.navigation.update();
            });
          }}
          onScroll={setSwipeDirection} // mousewheel events
          onKeyPress={setSwipeDirection} // keyboard events
          onSlideChange={setSwipeDirection} // swipe events
          onSlideChangeTransitionStart={(swiper) => swiper.disable()}
          onSlideChangeTransitionEnd={(swiper) => {
            swiper.enable();
            gotoStream();
            setTimeout(() => {
              swiper.update();
              swiper.slideReset();
              swiper.slideToClosest();
            });
          }}
          onTouchEnd={gotoStream} // mobile touch swipes
        >
          {playersData.map((player, i) => (
            <SwiperSlide key={`player-${i + 1}`}>
              {({ isVisible }) => (
                <Player
                  {...player}
                  id={i + 1}
                  blur={{ enabled: true }}
                  isPlayerVisible={isVisible}
                  setActivePlayer={setActivePlayer}
                  isPlayerActive={player.type === PLAYER_TYPES.ACTIVE}
                />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    )
  );
};

export default Feed;
