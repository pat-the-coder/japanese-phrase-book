import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, History, Settings, X } from 'lucide-react';

const App = () => {
  const [phrases, setPhrases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [delay, setDelay] = useState(10000); // 10 seconds default
  const [loading, setLoading] = useState(true);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Load phrases
  useEffect(() => {
    fetch('/phrases.json')
      .then(res => res.json())
      .then(data => {
        setPhrases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load phrases:", err);
        setLoading(false);
      });
  }, []);

  const playPhrase = useCallback((index) => {
    if (index < 0 || index >= phrases.length) return;
    
    const phrase = phrases[index];
    if (audioRef.current) {
      audioRef.current.src = `/audio/${phrase.audio}`;
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
      setIsPlaying(true);
      setShowEnglish(false);
      
      // Update history
      setHistory(prev => {
        const newHistory = [phrase, ...prev.filter(p => p.id !== phrase.id)];
        return newHistory.slice(0, 50); // Keep last 50
      });
    }
  }, [phrases]);

  const nextRandom = useCallback(() => {
    if (phrases.length === 0) return;
    
    let nextIdx;
    if (phrases.length === 1) {
      nextIdx = 0;
    } else {
      // Simple logic to avoid immediate repeat
      do {
        nextIdx = Math.floor(Math.random() * phrases.length);
      } while (nextIdx === currentIndex);
    }
    
    setCurrentIndex(nextIdx);
    playPhrase(nextIdx);
  }, [phrases, currentIndex, playPhrase]);

  const togglePlay = () => {
    if (currentIndex === -1) {
      nextRandom();
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    if (autoPlay) {
      timerRef.current = setTimeout(() => {
        nextRandom();
      }, delay);
    } else {
      setIsPlaying(false);
    }
  };

  const replay = () => {
    if (currentIndex !== -1) {
      playPhrase(currentIndex);
    }
  };

  if (loading) return <div className="loading">Loading phrases...</div>;

  const currentPhrase = currentIndex !== -1 ? phrases[currentIndex] : null;

  return (
    <div className="container">
      <header>
        <h1>Japanese Phrase Book</h1>
        <button onClick={() => setShowHistory(true)} className="icon-button">
          <History size={24} />
        </button>
      </header>

      <main className="display-area">
        {currentPhrase ? (
          <>
            <div className="japanese-text" onClick={replay}>
              {currentPhrase.jp}
            </div>
            
            <div className={`english-text ${showEnglish ? 'visible' : ''}`}>
              {currentPhrase.en}
            </div>

            {!showEnglish && (
              <button className="show-button" onClick={() => setShowEnglish(true)}>
                Show English
              </button>
            )}
          </>
        ) : (
          <div className="welcome">
            <p>Ready to start listening?</p>
            <button className="start-button" onClick={nextRandom}>
              Start Session
            </button>
          </div>
        )}
      </main>

      <footer className="controls">
        <div className="primary-controls">
          <button onClick={replay} disabled={currentIndex === -1}>
            <RotateCcw size={28} />
          </button>
          
          <button className="play-pause" onClick={togglePlay}>
            {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" />}
          </button>
          
          <button onClick={nextRandom}>
            <SkipForward size={28} fill="currentColor" />
          </button>
        </div>

        <div className="settings-strip">
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={autoPlay} 
              onChange={(e) => setAutoPlay(e.target.checked)} 
            />
            <span>Auto-play</span>
          </label>

          <select 
            value={delay} 
            onChange={(e) => setDelay(Number(e.target.value))}
            disabled={!autoPlay}
          >
            <option value={5000}>5s delay</option>
            <option value={10000}>10s delay</option>
            <option value={15000}>15s delay</option>
            <option value={20000}>20s delay</option>
          </select>
        </div>
      </footer>

      <audio 
        ref={audioRef} 
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* History Drawer */}
      <div className={`drawer ${showHistory ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>History</h2>
          <button onClick={() => setShowHistory(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="drawer-content">
          {history.length === 0 ? (
            <p className="empty-msg">No phrases played yet.</p>
          ) : (
            history.map((item, i) => (
              <div 
                key={`${item.id}-${i}`} 
                className="history-item"
                onClick={() => {
                  const idx = phrases.findIndex(p => p.id === item.id);
                  setCurrentIndex(idx);
                  playPhrase(idx);
                  setShowHistory(false);
                }}
              >
                <div className="history-jp">{item.jp}</div>
                <div className="history-en">{item.en}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
