import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, History, Settings, X, Eye, EyeOff } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capacitor-community/native-audio';
import { MediaSession } from '@capgo/capacitor-media-session';

const App = () => {
  const [phrases, setPhrases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem('autoPlay') === 'true');
  const [delay, setDelay] = useState(() => Number(localStorage.getItem('delay')) || 10000);
  const [alwaysShowEnglish, setAlwaysShowEnglish] = useState(() => localStorage.getItem('alwaysShowEnglish') === 'true');
  const [hotspot, setHotspot] = useState(() => localStorage.getItem('hotspot') === 'true');
  const [loading, setLoading] = useState(true);
  const [debugStatus, setDebugStatus] = useState('');
  const [iconDataUrl, setIconDataUrl] = useState(null);

  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const isNative = Capacitor.isNativePlatform();

  // Load icon as data URL for MediaSession (avoids capacitor:// unsupported URL error)
  useEffect(() => {
    if (!isNative) return;
    fetch(`${window.location.origin}/icon.png`)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setIconDataUrl(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
  }, [isNative]);

  // Refs for background-safe access in listeners
  const delayRef = useRef(delay);
  const isPlayingRef = useRef(isPlaying);
  const autoPlayRef = useRef(autoPlay);
  const alwaysShowEnglishRef = useRef(alwaysShowEnglish);
  const silenceCounterRef = useRef(0);
  const isWaitingRef = useRef(false);
  const phrasesRef = useRef(phrases);

  useEffect(() => { 
    delayRef.current = delay; 
    localStorage.setItem('delay', delay);
  }, [delay]);
  
  useEffect(() => { 
    isPlayingRef.current = isPlaying; 
  }, [isPlaying]);
  
  useEffect(() => { 
    autoPlayRef.current = autoPlay; 
    localStorage.setItem('autoPlay', autoPlay);
  }, [autoPlay]);

  useEffect(() => {
    alwaysShowEnglishRef.current = alwaysShowEnglish;
    localStorage.setItem('alwaysShowEnglish', alwaysShowEnglish);
  }, [alwaysShowEnglish]);

  useEffect(() => {
    localStorage.setItem('hotspot', hotspot);
  }, [hotspot]);

  useEffect(() => { 
    phrasesRef.current = phrases; 
  }, [phrases]);

  // 1. playPhrase
  const playPhrase = useCallback(async (index) => {
    const currentPhrases = phrasesRef.current;
    if (index < 0 || index >= currentPhrases.length) return;
    
    const phrase = currentPhrases[index];
    setDebugStatus(`Playing: ${phrase.audio}`);
    
    setHistory(prev => {
      const newHistory = [phrase, ...prev.filter(p => p.id !== phrase.id)];
      return newHistory.slice(0, 50);
    });

    setIsPlaying(true);
    setShowEnglish(alwaysShowEnglishRef.current);
    isWaitingRef.current = false;
    silenceCounterRef.current = 0;

    if (isNative) {
      try {
        await NativeAudio.stop({ assetId: 'silence' }).catch(() => {});
        await NativeAudio.stop({ assetId: 'current' }).catch(() => {});
        await NativeAudio.unload({ assetId: 'current' }).catch(() => {});
        
        await NativeAudio.preload({
          assetId: 'current',
          assetPath: `public/audio/${phrase.audio}`,
          audioChannelNum: 1,
          isComplex: true
        });
        
        await NativeAudio.play({ assetId: 'current' });

        await MediaSession.setMetadata({
          title: phrase.jp,
          artist: phrase.en,
          album: 'Japanese Phrase Book',
          artwork: iconDataUrl ? [
            { src: iconDataUrl, sizes: '512x512', type: 'image/png' }
          ] : []
        }).catch(() => {});
        
        await MediaSession.setPlaybackState({
          playbackState: 'playing'
        }).catch(() => {});
      } catch (e) {
        setDebugStatus(`Error: ${e.message}`);
        setIsPlaying(false);
      }
    } else if (audioRef.current) {
      audioRef.current.src = `audio/${phrase.audio}`;
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [isNative]);

  // 2. nextRandom
  const nextRandom = useCallback(() => {
    const currentPhrases = phrasesRef.current;
    if (currentPhrases.length === 0) return;
    
    let nextIdx;
    if (currentPhrases.length === 1) {
      nextIdx = 0;
    } else {
      do {
        nextIdx = Math.floor(Math.random() * currentPhrases.length);
      } while (nextIdx === currentIndex);
    }
    
    setCurrentIndex(nextIdx);
    playPhrase(nextIdx);
  }, [currentIndex, playPhrase]);

  // Stable ref for nextRandom to use in listener
  const nextRandomRef = useRef(nextRandom);
  useEffect(() => { nextRandomRef.current = nextRandom; }, [nextRandom]);

  // 3. Native Heartbeat Listener
  useEffect(() => {
    if (!isNative) return;

    NativeAudio.preload({
      assetId: 'silence',
      assetPath: 'public/audio/silence.mp3',
      audioChannelNum: 1,
      isComplex: true
    }).catch(() => {});

    const listener = NativeAudio.addListener('complete', (data) => {
      if (data.assetId === 'current') {
        if (autoPlayRef.current) {
          isWaitingRef.current = true;
          silenceCounterRef.current = 0;
          setDebugStatus('Waiting...');
          NativeAudio.play({ assetId: 'silence' }).catch(() => {});
        } else {
          setIsPlaying(false);
          MediaSession.setPlaybackState({ playbackState: 'paused' }).catch(() => {});
        }
      } else if (data.assetId === 'silence') {
        if (isWaitingRef.current && isPlayingRef.current) {
          silenceCounterRef.current += 1;
          const currentDelay = delayRef.current;
          
          if (silenceCounterRef.current * 1000 >= currentDelay) {
            isWaitingRef.current = false;
            silenceCounterRef.current = 0;
            nextRandomRef.current();
          } else {
            NativeAudio.play({ assetId: 'silence' }).catch(() => {});
          }
        }
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [isNative]);

  // 4. Load phrases
  useEffect(() => {
    fetch('phrases.json')
      .then(res => res.json())
      .then(data => {
        setPhrases(data);
        setLoading(false);
      })
      .catch(err => {
        setDebugStatus(`Load error: ${err.message}`);
        setLoading(false);
      });
  }, []);

  // 5. User Interaction Handlers
  const togglePlay = useCallback(() => {
    if (currentIndex === -1) {
      nextRandom();
      return;
    }

    if (isPlayingRef.current) {
      if (isNative) {
        NativeAudio.stop({ assetId: 'current' }).catch(() => {});
        NativeAudio.stop({ assetId: 'silence' }).catch(() => {});
        isWaitingRef.current = false;
        MediaSession.setPlaybackState({ playbackState: 'paused' }).catch(() => {});
      } else {
        audioRef.current?.pause();
      }
      setIsPlaying(false);
      setDebugStatus('Paused');
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setIsPlaying(true);
      setDebugStatus('Playing...');
      playPhrase(currentIndex);
    }
  }, [currentIndex, isNative, nextRandom, playPhrase]);

  const replay = useCallback(() => {
    if (currentIndex !== -1) {
      playPhrase(currentIndex);
    }
  }, [currentIndex, playPhrase]);

  const handleEnded = () => {
    if (!isNative) {
      if (autoPlay) {
        timerRef.current = setTimeout(() => {
          nextRandom();
        }, delay);
      } else {
        setIsPlaying(false);
      }
    }
  };

  // 6. Media Session Action Handlers
  useEffect(() => {
    if (!isNative) return;

    MediaSession.setActionHandler({ action: 'play' }, () => {
      togglePlay();
    });
    MediaSession.setActionHandler({ action: 'pause' }, () => {
      togglePlay();
    });
    MediaSession.setActionHandler({ action: 'nexttrack' }, () => {
      nextRandom();
    });
    MediaSession.setActionHandler({ action: 'previoustrack' }, () => {
      replay();
    });

    return () => {
      MediaSession.setActionHandler({ action: 'play' }, null);
      MediaSession.setActionHandler({ action: 'pause' }, null);
      MediaSession.setActionHandler({ action: 'nexttrack' }, null);
      MediaSession.setActionHandler({ action: 'previoustrack' }, null);
    };
  }, [isNative, togglePlay, nextRandom, replay]);

  if (loading) return <div className="loading">Loading phrases...</div>;

  const currentPhrase = currentIndex !== -1 ? phrases[currentIndex] : null;

  return (
    <div className="container">
      {hotspot && (
        <div className="hotspot-overlay">
          <div className="hotspot-left" onClick={replay} />
          <div className="hotspot-right" onClick={nextRandom} />
        </div>
      )}
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
            
            <div className={`english-text ${(showEnglish || alwaysShowEnglish) ? 'visible' : ''}`}>
              {currentPhrase.en}
            </div>

            {(!showEnglish && !alwaysShowEnglish) && (
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
              checked={alwaysShowEnglish}
              onChange={(e) => setAlwaysShowEnglish(e.target.checked)}
            />
            <span>Always Show English</span>
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={hotspot}
              onChange={(e) => setHotspot(e.target.checked)}
            />
            <span>Hot Spot</span>
          </label>

          <div className="autoplay-settings">
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
        </div>
      </footer>

      <audio 
        ref={audioRef} 
        onEnded={handleEnded}
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
