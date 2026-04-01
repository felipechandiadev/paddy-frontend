'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextField } from '@/shared/components/ui/TextField/TextField';

export default function TemplatesSearchBar() {
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
    <div className="w-full md:w-72">
      <TextField
        label="Buscar"
        placeholder="Buscar plantilla..."
        value={search}
        onChange={handleSearchChange}
      />
    </div>
  );
}
