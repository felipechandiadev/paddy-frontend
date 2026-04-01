'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextField } from '@/shared/components/ui/TextField/TextField';

export default function UsersSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSearch(value);

    const params = new URLSearchParams();
    if (value.trim()) {
      params.set('search', value);
    }

    router.push(`/paddy/users${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="w-full max-w-sm">
      <TextField
        label="Buscar usuarios"
        placeholder="Buscar por email o nombre..."
        value={search}
        onChange={handleSearchChange}
        startIcon="search"
      />
    </div>
  );
}
