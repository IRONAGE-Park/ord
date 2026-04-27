import { TopBar } from './components/TopBar';
import { FilterPanel } from './components/FilterPanel';
import { NowDeck } from './components/NowDeck';
import { GradeGrid } from './components/GradeGrid';
import { Sidebar } from './components/Sidebar';
import { RecipeTreeModal } from './components/RecipeTreeModal';
import { CandidatesModal } from './components/CandidatesModal';
import { CommandPalette } from './components/CommandPalette';
import { useDarkMode, useHotkeys } from './hooks';
import './App.css';

function App() {
  useDarkMode();
  useHotkeys();

  return (
    <div className="app-shell">
      <TopBar />
      <FilterPanel />
      <NowDeck />
      <main className="main-content">
        <GradeGrid />
      </main>
      <footer className="app-footer">
        클론: 데이터 출처{' '}
        <a
          href="https://ordsearch.net/mix/helper"
          target="_blank"
          rel="noopener noreferrer"
        >
          ordsearch.net/mix/helper
        </a>{' '}
        · 아이콘 © ordsearch
      </footer>
      <Sidebar />
      <RecipeTreeModal />
      <CandidatesModal />
      <CommandPalette />
    </div>
  );
}

export default App;
