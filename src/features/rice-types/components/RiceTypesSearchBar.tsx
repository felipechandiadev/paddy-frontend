'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextField } from '@/shared/components/ui/TextField/TextField';

export default function RiceTypesSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full">
      <TextField
        label=""
        placeholder="Buscar tipo de arroz..."
        value={search}
        onChange={handleSearchChange}
      />
    </div>
  );
}
