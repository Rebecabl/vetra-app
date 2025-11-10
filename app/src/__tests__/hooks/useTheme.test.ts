import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTheme from '../../hooks/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('initializes with system preference', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBeDefined();
    expect(['light', 'dark']).toContain(result.current.theme);
  });

  it('saves theme to localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(localStorage.getItem('vetra:theme')).toBe('dark');
  });

  it('applies dark class to document', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
