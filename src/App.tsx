import { useEffect, useMemo, useState } from 'react'
import cardsData from './data/cards.json'

type Section =
  | 'SIP'
  | 'VoIP'
  | 'Networking'
  | 'Queueing Theory'
  | 'LTE/5G/Wireless'
  | 'RF/MANET'
  | 'Cybersecurity'

type Difficulty = 'beginner' | 'intermediate' | 'advanced'

type Card = {
  id: string
  section: Section
  topic: string
  front: string
  back: string
  tags: string[]
  difficulty: Difficulty
}

const sections: Array<'All sections' | Section> = [
  'All sections',
  'SIP',
  'VoIP',
  'Networking',
  'Queueing Theory',
  'LTE/5G/Wireless',
  'RF/MANET',
  'Cybersecurity'
]

const cards = cardsData as Card[]
const missedStorageKey = 'rtc-flashcards.missed-cards.v1'

function normalize(value: string) {
  return value.toLowerCase().trim()
}

function shuffleList<T>(items: T[]) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = temp
  }

  return copy
}

function loadMissedCards() {
  if (typeof window === 'undefined') {
    return new Set<string>()
  }

  try {
    const raw = window.localStorage.getItem(missedStorageKey)
    if (!raw) {
      return new Set<string>()
    }

    const parsed = JSON.parse(raw) as string[]
    return new Set(parsed)
  } catch {
    return new Set<string>()
  }
}

function App() {
  const [section, setSection] = useState<'All sections' | Section>('All sections')
  const [search, setSearch] = useState('')
  const [shuffle, setShuffle] = useState(false)
  const [reviewMissed, setReviewMissed] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [currentCardId, setCurrentCardId] = useState(cards[0]?.id ?? '')
  const [missedCards, setMissedCards] = useState(() => loadMissedCards())

  useEffect(() => {
    window.localStorage.setItem(
      missedStorageKey,
      JSON.stringify(Array.from(missedCards))
    )
  }, [missedCards])

  const filteredCards = useMemo(() => {
    const query = normalize(search)

    return cards.filter((card) => {
      const sectionMatches = section === 'All sections' || card.section === section
      const reviewMatches = !reviewMissed || missedCards.has(card.id)
      const searchMatches =
        query.length === 0 ||
        [card.topic, card.front, card.back, card.section, card.difficulty, ...card.tags]
          .join(' ')
          .toLowerCase()
          .includes(query)

      return sectionMatches && reviewMatches && searchMatches
    })
  }, [missedCards, reviewMissed, search, section])

  const visibleCards = useMemo(() => {
    if (!shuffle) {
      return filteredCards
    }

    return shuffleList(filteredCards)
  }, [filteredCards, shuffle])

  const currentIndex = useMemo(() => {
    const index = visibleCards.findIndex((card) => card.id === currentCardId)
    return index >= 0 ? index : 0
  }, [currentCardId, visibleCards])

  const activeCard = visibleCards[currentIndex]

  useEffect(() => {
    if (visibleCards.length === 0) {
      if (currentCardId) {
        setCurrentCardId('')
      }
      setFlipped(false)
      return
    }

    const currentExists = visibleCards.some((card) => card.id === currentCardId)
    if (!currentExists) {
      setCurrentCardId(visibleCards[0].id)
      setFlipped(false)
    }
  }, [currentCardId, visibleCards])

  useEffect(() => {
    setFlipped(false)
  }, [activeCard?.id])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true

      if (isTypingTarget) {
        return
      }

      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault()
        setFlipped((currentValue) => !currentValue)
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrevious()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const sectionCounts = useMemo(() => {
    return sections.reduce<Record<string, number>>((counts, currentSection) => {
      if (currentSection === 'All sections') {
        counts[currentSection] = cards.length
        return counts
      }

      counts[currentSection] = cards.filter((card) => card.section === currentSection).length
      return counts
    }, {})
  }, [])

  const missedCount = useMemo(() => missedCards.size, [missedCards])
  const visibleMissedCount = useMemo(
    () => visibleCards.filter((card) => missedCards.has(card.id)).length,
    [missedCards, visibleCards]
  )

  function setCurrentByIndex(nextIndex: number) {
    if (visibleCards.length === 0) {
      return
    }

    const normalizedIndex = (nextIndex + visibleCards.length) % visibleCards.length
    setCurrentCardId(visibleCards[normalizedIndex].id)
  }

  function goNext() {
    setCurrentByIndex(currentIndex + 1)
  }

  function goPrevious() {
    setCurrentByIndex(currentIndex - 1)
  }

  function toggleMissed(cardId: string) {
    setMissedCards((currentMissed) => {
      const nextMissed = new Set(currentMissed)
      if (nextMissed.has(cardId)) {
        nextMissed.delete(cardId)
      } else {
        nextMissed.add(cardId)
      }

      return nextMissed
    })
  }

  function clearMissed() {
    setMissedCards(new Set())
  }

  const progressText = visibleCards.length === 0 ? '0 of 0' : `${currentIndex + 1} of ${visibleCards.length}`
  const progressValue = visibleCards.length === 0 ? 0 : ((currentIndex + 1) / visibleCards.length) * 100

  return (
    <div className="appShell">
      <div className="backgroundOrbs" />

      <main className="appFrame">
        <section className="heroPanel panel">
          <div className="heroCopy">
            <p className="eyebrow">Real-time communications study deck</p>
            <h1>RTC Systems Flashcards</h1>
            <p className="heroText">
              Active-recall flashcards distilled from the Beamer source in <span>flashcards.tex</span>.
              Review SIP, VoIP, networking, queueing theory, wireless, RF, MANET, and cybersecurity from one deck.
            </p>
          </div>

          <div className="heroStats">
            <div className="statTile">
              <span className="statValue">{cards.length}</span>
              <span className="statLabel">cards</span>
            </div>
            <div className="statTile">
              <span className="statValue">{missedCount}</span>
              <span className="statLabel">missed</span>
            </div>
            <div className="statTile">
              <span className="statValue">{visibleCards.length}</span>
              <span className="statLabel">visible</span>
            </div>
          </div>
        </section>

        <div className="workspaceGrid">
          <section className="deckPanel panel">
            <div className="panelRow">
              <label className="searchField">
                <span>Search topic, tag, or answer</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search SIP, QoS, Little's law, HARQ..."
                />
              </label>

              <div className="toggleCluster">
                <button
                  type="button"
                  className={shuffle ? 'toggleButton active' : 'toggleButton'}
                  onClick={() => setShuffle((currentValue) => !currentValue)}
                >
                  Shuffle
                </button>
                <button
                  type="button"
                  className={reviewMissed ? 'toggleButton active' : 'toggleButton'}
                  onClick={() => setReviewMissed((currentValue) => !currentValue)}
                >
                  Review missed {visibleMissedCount > 0 ? `(${visibleMissedCount})` : ''}
                </button>
              </div>
            </div>

            <div className="progressBlock" aria-label="deck progress">
              <div className="progressMeta">
                <span>{progressText}</span>
                <span>{activeCard ? activeCard.section : 'No cards match the current filters'}</span>
              </div>
              <div className="progressBarTrack">
                <div className="progressBarFill" style={{ width: `${progressValue}%` }} />
              </div>
            </div>

            <button
              type="button"
              className={activeCard ? `flashcard ${flipped ? 'flipped' : ''}` : 'flashcard empty'}
              onClick={() => setFlipped((currentValue) => !currentValue)}
              aria-label={activeCard ? `Flashcard for ${activeCard.topic}` : 'Empty flashcard'}
              disabled={!activeCard}
            >
              {activeCard ? (
                <div className="flashcardInner">
                  <div className="flashcardFace flashcardFront">
                    <div className="cardHeader">
                      <span className="sectionBadge">{activeCard.section}</span>
                      <span className="difficultyBadge">{activeCard.difficulty}</span>
                    </div>
                    <p className="cardTopic">{activeCard.topic}</p>
                    <p className="cardPrompt">{activeCard.front}</p>
                    <p className="cardHint">Press Space to flip</p>
                  </div>

                  <div className="flashcardFace flashcardBack">
                    <div className="cardHeader">
                      <span className="sectionBadge">{activeCard.section}</span>
                      <span className="difficultyBadge">{activeCard.difficulty}</span>
                    </div>
                    <p className="cardTopic">{activeCard.topic}</p>
                    <p className="cardAnswer">{activeCard.back}</p>
                    <div className="tagRow">
                      {activeCard.tags.map((tag) => (
                        <span key={tag} className="tagChip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="emptyState">
                  <p>No cards match the current filters.</p>
                  <span>Try another section, clear the search, or turn off Review missed.</span>
                </div>
              )}
            </button>

            <div className="controlsRow">
              <button type="button" className="controlButton" onClick={goPrevious} disabled={!activeCard}>
                Previous
              </button>
              <button type="button" className="controlButton primary" onClick={() => setFlipped((value) => !value)} disabled={!activeCard}>
                Flip
              </button>
              <button type="button" className="controlButton" onClick={goNext} disabled={!activeCard}>
                Next
              </button>
              <button type="button" className="controlButton missButton" onClick={() => activeCard && toggleMissed(activeCard.id)} disabled={!activeCard}>
                {activeCard && missedCards.has(activeCard.id) ? 'Unmark missed' : 'Mark missed'}
              </button>
            </div>
          </section>

          <aside className="sidebarPanel panel">
            <div className="sidebarSection">
              <div className="sidebarHeading">Deck sections</div>
              <div className="sectionList">
                {sections.map((currentSection) => {
                  const active = section === currentSection

                  return (
                    <button
                      key={currentSection}
                      type="button"
                      className={active ? 'sectionPill active' : 'sectionPill'}
                      onClick={() => setSection(currentSection)}
                    >
                      <span>{currentSection}</span>
                      <span>{sectionCounts[currentSection]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="sidebarSection">
              <div className="sidebarHeading">Current card</div>
              {activeCard ? (
                <div className="cardSummary">
                  <p>{activeCard.topic}</p>
                  <p>{activeCard.front}</p>
                  <div className="tagRow compact">
                    {activeCard.tags.map((tag) => (
                      <span key={tag} className="tagChip subdued">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="cardSummary">
                  <p>No visible cards.</p>
                  <p>Adjust the filters to bring cards back into view.</p>
                </div>
              )}
            </div>

            <div className="sidebarSection">
              <div className="sidebarHeading">Missed review</div>
              <div className="metricList">
                <div>
                  <span>Missed cards</span>
                  <strong>{missedCount}</strong>
                </div>
                <div>
                  <span>Visible missed</span>
                  <strong>{visibleMissedCount}</strong>
                </div>
              </div>
              <button type="button" className="controlButton subtle" onClick={clearMissed} disabled={missedCount === 0}>
                Clear missed cards
              </button>
            </div>

            <div className="sidebarSection">
              <div className="sidebarHeading">Keyboard</div>
              <ul className="shortcutList">
                <li>Space flips the card</li>
                <li>ArrowRight moves forward</li>
                <li>ArrowLeft moves back</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default App
