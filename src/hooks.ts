import { useEffect } from 'react';
import { useApp } from './store';
import { COMMON_HOTKEYS } from './constants';

export function useHotkeys() {
  const add = useApp(s => s.add);
  const remove = useApp(s => s.remove);
  const reset = useApp(s => s.reset);
  const undo = useApp(s => s.undo);
  const redo = useApp(s => s.redo);
  const openCandidates = useApp(s => s.openCandidatesModal);
  const openCommandPalette = useApp(s => s.openCommandPalette);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // 입력 필드 안에서는 무시
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // ! = 후보 비교 (Shift+1) — 키 자체가 '!' 로 들어옴
      if (e.key === '!') {
        openCandidates();
        e.preventDefault();
        return;
      }

      // / = 검색 팔레트 열기
      if (e.key === '/') {
        openCommandPalette();
        e.preventDefault();
        return;
      }

      const key = e.key.toLowerCase();

      // 흔함 추가/감소
      if (COMMON_HOTKEYS[key] !== undefined) {
        const id = COMMON_HOTKEYS[key];
        if (e.shiftKey) remove(id, 1);
        else add(id, 1);
        e.preventDefault();
        return;
      }

      if (key === 't') {
        if (confirm('현재 조합 상태를 초기화하시겠습니까? (T)')) reset();
        e.preventDefault();
        return;
      }

      if (key === 'z') {
        if (e.shiftKey) redo();
        else undo();
        e.preventDefault();
        return;
      }
      if (key === 'y') {
        redo();
        e.preventDefault();
        return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [add, remove, reset, undo, redo, openCandidates, openCommandPalette]);
}

export function useDarkMode() {
  const mode = useApp(s => s.darkMode);

  useEffect(() => {
    const apply = (m: 'auto' | 'dark' | 'light') => {
      let resolved: 'dark' | 'light';
      if (m === 'auto') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      } else {
        resolved = m;
      }
      document.documentElement.setAttribute('data-theme', resolved);
    };
    apply(mode);

    if (mode === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => apply('auto');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, [mode]);
}
