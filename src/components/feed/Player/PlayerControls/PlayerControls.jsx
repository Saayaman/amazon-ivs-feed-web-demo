import React, { useImperativeHandle, useRef } from 'react';

import Button from '../../../common/Button';
import Like from '../../like';

import './PlayerControls.css';

const PlayerControls = React.forwardRef((props, ref) => {
  const { player, toggleMetadata, setSwipeDirection } = props;
  const nextBtnRef = useRef();
  const prevBtnRef = useRef();

  useImperativeHandle(ref, () => ({
    get nextBtn() {
      return nextBtnRef.current;
    },
    get prevBtn() {
      return prevBtnRef.current;
    }
  }));

  return (
    player && (
      <div className="player-buttons">
        <Like />
        <Button onClick={() => player.toggleMute()}>
          {player.muted ? 'VolumeOff' : 'VolumeUp'}
        </Button>
        <hr className="divider" />
        <Button
          id="prev-stream"
          ref={prevBtnRef}
          onClick={() => setSwipeDirection('prev')}
        >
          ChevronUp
        </Button>
        <Button
          id="next-stream"
          ref={nextBtnRef}
          onClick={() => setSwipeDirection('next')}
        >
          ChevronDown
        </Button>
        <span className="metadata-toggle">
          <hr className="divider" />
          <Button onClick={() => toggleMetadata()}>Description</Button>
        </span>
      </div>
    )
  );
});

export default PlayerControls;
