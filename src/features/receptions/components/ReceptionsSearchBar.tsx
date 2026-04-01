'use client';

import React, { useState } from 'react';
import { TextField } from '@/shared/components/ui/TextField/TextField';

interface ReceptionsSearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function ReceptionsSearchBar({ onSearch, isLoading }: ReceptionsSearchBarProps) {
  const [search, setSearch] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearch(value);
  };

  return (
    <div className="w-full max-w-sm">
      <TextField
        label="Buscar recepción"
        placeholder="Guía, placa, productor..."
        value={search}
        onChange={handleChange}
        disabled={isLoading}
      />
    </div>
  );
}
