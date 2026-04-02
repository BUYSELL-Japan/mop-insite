import { useState, useEffect } from 'react';

// プレビュー環境かどうかを判定
const isPreviewEnvironment = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname.includes('stackblitz') ||
         window.location.hostname.includes('webcontainer');
};

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // プレビュー環境では常に初期値を使用
    if (isPreviewEnvironment()) {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  useEffect(() => {
    // プレビュー環境ではローカルストレージに保存しない
    if (isPreviewEnvironment()) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    } catch (error) {
      console.error('Error setting localStorage value:', error);
    }
  };

  return [storedValue, setValue] as const;
}