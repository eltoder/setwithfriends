import React, { useState, useEffect, useRef } from 'react';
import sound from '../assets/lofimusic.mp3'; // import the sound file
import './VolumeSlider.css';

function Slider() {
  const [volume, setVolume] = useState(0); // starts off at 0

  // Reference for the audio player
  const audioPlayer = useRef(null);

  useEffect(() => {
    if (audioPlayer.current) {
      audioPlayer.current.volume = volume / 100;
      audioPlayer.current.play().then(() => {
      }).catch(error => {
        console.error("Error playing audio:", error);
      });
    }
  }, [volume]);

  // function will update the background color based on the slider position
  const handleSliderChange = (e) => {
    setVolume(e.target.value);  // update the volume state
  };

  return (
    <div className="App">
      {/* Container with background */}
      <div className="container">
         <audio ref={audioPlayer} src={sound} autoPlay loop onLoadedData={() => console.log("Audio loaded")} />

        {/* volume slider */}
        <input
          type="range"
          id="my-slider"
          min="0"
          max="100"
          value={volume}
          onChange={handleSliderChange} // the volume will change when the slider is moved
          style={{
            background: `linear-gradient(to right, #7a0e81 ${volume}%,rgb(161, 134, 161) ${volume}%)`,
            accentColor: '#7a0e81',
          }}
        />

        {/* display slider number */}
        <div id="slider-value">{volume}</div>
      </div>
    </div>
  );
}

export default Slider;
