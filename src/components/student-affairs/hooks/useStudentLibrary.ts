import { useState } from 'react';

export function useStudentLibrary() {
  const [borrowedBooksCount, setBorrowedBooksCount] = useState<number>(0);
  const [delayFines, setDelayFines] = useState<number>(0);

  return {
    borrowedBooksCount,
    setBorrowedBooksCount,
    delayFines,
    setDelayFines,
  };
}
