import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ChangeEvent } from 'react'
import { Howl } from 'howler'
import type { FormEvent } from 'react'
import './App.css'
import { sceneConfig } from './config'

function App() {
  const [phase, setPhase] = useState<'intro' | 'greeting' | 'ready' | 'password' | 'wrong' | 'success' | 'transition' | 'diaryOpening' | 'museum' | 'music' | 'closing'>('intro')
  const [input, setInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [displayedGreeting, setDisplayedGreeting] = useState('')
  const [selectedArtwork, setSelectedArtwork] = useState<typeof sceneConfig.artworks[number]>(sceneConfig.artworks[0])
  const [songIndex, setSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.75)
  const [audio, setAudio] = useState<import('howler').Howl | null>(null)

  useEffect(() => {
    if (phase !== 'greeting') return

    let index = 0
    setDisplayedGreeting('')

    const timer = window.setInterval(() => {
      setDisplayedGreeting(() => {
        const next = sceneConfig.greeting.slice(0, index + 1)
        index += 1
        if (index >= sceneConfig.greeting.length) {
          window.clearInterval(timer)
          setPhase('ready')
        }
        return next
      })
    }, 55)

    return () => window.clearInterval(timer)
  }, [phase])

  const handleContinue = () => {
    if (phase === 'ready') {
      setPhase('password')
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (input.trim().toLowerCase() === sceneConfig.password) {
      setPhase('success')
      return
    }

    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    setInput('')
    setShowHint(nextAttempts >= 3)
    setPhase('wrong')
    window.setTimeout(() => setPhase('password'), 450)
  }

  const handleReset = () => {
    setInput('')
    setAttempts(0)
    setShowHint(false)
    setPhase('password')
  }

  const currentSong = sceneConfig.songs[songIndex]

  const openClosing = () => {
    setPhase('closing')
  }

  useEffect(() => {
    if (!currentSong.audioFile) {
      setAudio(null)
      return
    }

    const url = new URL(`../assests/music/${currentSong.audioFile}`, import.meta.url).href
    const howl = new Howl({
      src: [url],
      html5: true,
      volume,
      onend: () => {
        setIsPlaying(false)
        setProgress(0)
      },
    })

    setAudio(howl)
    return () => {
      howl.stop()
      howl.unload()
    }
  }, [currentSong, volume])

  useEffect(() => {
    if (!audio) return
    audio.volume(volume)
  }, [audio, volume])

  useEffect(() => {
    if (!audio || !isPlaying) return

    const interval = window.setInterval(() => {
      const position = audio.seek() as number
      const duration = audio.duration() || 1
      setProgress(position / duration)
    }, 300)

    return () => window.clearInterval(interval)
  }, [audio, isPlaying])

  const shellBackground = ['intro', 'greeting', 'ready', 'password', 'wrong'].includes(phase)
    ? sceneConfig.colors.background
    : sceneConfig.colors.bgLight

  const playDisabled = !currentSong.audioFile

  const handleTogglePlay = () => {
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }
    audio.play()
    setIsPlaying(true)
  }

  const handlePrevSong = () => {
    setSongIndex((index) => (index === 0 ? sceneConfig.songs.length - 1 : index - 1))
    setIsPlaying(false)
    setProgress(0)
  }

  const handleNextSong = () => {
    setSongIndex((index) => (index === sceneConfig.songs.length - 1 ? 0 : index + 1))
    setIsPlaying(false)
    setProgress(0)
  }

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    if (!audio) return
    const duration = audio.duration() || 1
    audio.seek(value * duration)
    setProgress(value)
  }

  const handleVolume = (event: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value))
  }

  return (
    <div className="app-shell" style={{ backgroundColor: shellBackground, color: sceneConfig.colors.ink }}>
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="scene intro-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            onClick={() => setPhase('greeting')}
          >
            <pre className="hello-kitty" aria-label="Hello Kitty ASCII art">
              {sceneConfig.asciiArt}
            </pre>
            <p className="intro-caption">{sceneConfig.title}</p>
          </motion.div>
        )}

        {phase === 'greeting' && (
          <motion.div
            key="greeting"
            className="scene greeting-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="typewriter" aria-live="polite">
              {displayedGreeting}
            </div>
          </motion.div>
        )}

        {phase === 'ready' && (
          <motion.div
            key="ready"
            className="scene ready-scene"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <button type="button" className="continue-link" onClick={handleContinue}>
              {sceneConfig.continueText}
            </button>
          </motion.div>
        )}

        {(phase === 'password' || phase === 'wrong') && (
          <motion.div
            key="password"
            className="scene password-scene"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className={`password-card ${phase === 'wrong' ? 'shake' : ''}`}>
              <p className="password-label">Enter the secret password</p>
              <form onSubmit={handleSubmit}>
                <input
                  autoFocus
                  type="password"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="••••••"
                />
              </form>
              {showHint && <p className="hint">{sceneConfig.hint}</p>}
            </div>
          </motion.div>
        )}

        {phase === 'success' && (
          <motion.div
            key="success"
            className="scene success-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          >
            <div className="success-glow" />
          </motion.div>
        )}

        {phase === 'transition' && (
          <motion.div
            key="transition"
            className="scene transition-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <motion.div
              className="paper-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              <div className="paper-copy">
                <p className="diary-title">{sceneConfig.diaryTitle}</p>
                <p>{sceneConfig.diaryIntro}</p>
                <button className="open-diary-button" type="button" onClick={() => setPhase('diaryOpening')}>
                  {sceneConfig.diaryOpenText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 'diaryOpening' && (
          <motion.div
            key="diaryOpening"
            className="scene opened-scene"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <motion.div
              className="opened-page"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              <div className="paper-copy">
                <p className="diary-title">{sceneConfig.diaryTitle}</p>
                <p className="missing-note">{sceneConfig.missingDrawingsNote}</p>
                {sceneConfig.diaryEntry.split('\n\n').map((block, index) => (
                  <p key={index}>{block}</p>
                ))}
                <button className="museum-button" type="button" onClick={() => setPhase('museum')}>
                  {sceneConfig.museumContinueText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 'museum' && (
          <motion.div
            key="museum"
            className="scene museum-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <div className="museum-header">
              <div>
                <p className="museum-title">{sceneConfig.museumTitle}</p>
                <p className="museum-description">{sceneConfig.museumDescription}</p>
              </div>
              <button className="reset-link" type="button" onClick={handleReset}>
                Back
              </button>
            </div>
            <div className="museum-gallery">
              <div className="artwork-grid">
                {sceneConfig.artworks.map((artwork) => (
                  <button
                    key={artwork.id}
                    type="button"
                    className={`artwork-frame ${selectedArtwork.id === artwork.id ? 'active' : ''}`}
                    onClick={() => setSelectedArtwork(artwork)}
                  >
                    <img src={new URL(`../assests/img/${artwork.filename}`, import.meta.url).href} alt={artwork.title} />
                    <div className="frame-label">
                      <span>{artwork.title}</span>
                      <small>{artwork.credit}</small>
                    </div>
                  </button>
                ))}
              </div>
              <div className="artwork-preview">
                <img src={new URL(`../assests/img/${selectedArtwork.filename}`, import.meta.url).href} alt={selectedArtwork.title} />
                <div className="preview-copy">
                  <h3>{selectedArtwork.title}</h3>
                  <p>{selectedArtwork.credit}</p>
                  <button className="museum-button" type="button" onClick={() => setPhase('music')}>
                    {sceneConfig.musicContinueText}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {phase === 'music' && (
          <motion.div
            key="music"
            className="scene music-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <div className="music-header">
              <div>
                <p className="music-title">{sceneConfig.musicTitle}</p>
                <p className="music-description">{sceneConfig.musicDescription}</p>
              </div>
              <button className="reset-link" type="button" onClick={handleReset}>
                Back
              </button>
            </div>
            <div className="music-player">
              <div className="player-meta">
                <span className="track-label">Now playing</span>
                <h3>{currentSong.title}</h3>
              </div>
              <div className="player-controls">
                <button type="button" className="player-button" onClick={handlePrevSong}>
                  Prev
                </button>
                <button
                  type="button"
                  className="player-button"
                  onClick={handleTogglePlay}
                  disabled={playDisabled}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button type="button" className="player-button" onClick={handleNextSong}>
                  Next
                </button>
              </div>
              <div className="player-range">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={progress}
                  onChange={handleSeek}
                  disabled={playDisabled}
                />
              </div>
              <div className="volume-row">
                <label htmlFor="volume">Volume</label>
                <input
                  id="volume"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={handleVolume}
                />
              </div>
              <button className="music-next-button" type="button" onClick={openClosing}>
                {sceneConfig.closingContinueText}
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'closing' && (
          <motion.div
            key="closing"
            className="scene next-scene"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <motion.div
              className="opened-page next-tab-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              <div className="paper-copy">
                <p className="diary-title">{sceneConfig.closingTitle}</p>
                <p>{sceneConfig.closingText}</p>
                <button className="museum-button" type="button" onClick={handleReset}>
                  {sceneConfig.closingResetText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {['transition', 'diaryOpening', 'museum', 'music', 'closing'].includes(phase) && (
        <motion.div
          className="corner-player"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="corner-player-inner">
            <div className="corner-player-meta">
              <span className="corner-player-label">Now playing</span>
              <strong>{currentSong.title}</strong>
            </div>
            <div className="corner-player-controls">
              <button type="button" className="player-button small" onClick={handlePrevSong}>
                ◀
              </button>
              <button
                type="button"
                className="player-button small"
                onClick={handleTogglePlay}
                disabled={playDisabled}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button type="button" className="player-button small" onClick={handleNextSong}>
                ▶
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'success' && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          onAnimationComplete={() => setPhase('transition')}
        />
      )}

      {phase === 'transition' && (
        <div className="helper-row">
          <button type="button" className="reset-link" onClick={handleReset}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

export default App
