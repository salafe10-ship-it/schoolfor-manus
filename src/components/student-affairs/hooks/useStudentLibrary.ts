import { useState } from 'react';

export function useStudentLibrary() {
  const [borrowedBooksCount, setBorrowedBooksCount] = useState<number>(1);
  const [delayFines, setDelayFines] = useState<number>(0);

  return {
    borrowedBooksCount,
    setBorrowedBooksCount,
    delayFines,
    setDelayFines,
  };
}
