'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ProducersDataGrid from './ProducersDataGrid';
import CreateProducerDialog from './CreateProducerDialog';
import DeleteProducerDialog from './DeleteProducerDialog';
import ProducerDetailDialog from './detail/ProducerDetailDialog';
import { Producer } from '../types/producers.types';

interface ProducersPageProps {
  initialProducers: Producer[];
}

export default function ProducersPage({ initialProducers }: ProducersPageProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [producers, setProducers] = useState<Producer[]>(initialProducers);
  const [filteredProducers, setFilteredProducers] = useState<Producer[]>(initialProducers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (!query) {
        setFilteredProducers(producers);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const filtered = producers.filter(
        (producer) =>
          producer.name.toLowerCase().includes(lowerQuery) ||
          producer.rut.toLowerCase().includes(lowerQuery) ||
          producer.email.toLowerCase().includes(lowerQuery) ||
          producer.city.toLowerCase().includes(lowerQuery)
      );

      setFilteredProducers(filtered);
    },
    [producers]
  );

  const handleAddClick = () => {
    setCreateDialogOpen(true);
  };

  const handleDeleteClick = (producer: Producer) => {
    setSelectedProducer(producer);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (producer: Producer) => {
    setSelectedProducer(producer);
    setDetailDialogOpen(true);
  };

  const handleCreateSuccess = (newProducer: Producer) => {
    setProducers((prev) => [newProducer, ...prev]);
    setFilteredProducers((prev) => [newProducer, ...prev]);
  };

  const handleDeleteSuccess = () => {
    if (selectedProducer) {
      setProducers((prev) => prev.filter((p) => p.id !== selectedProducer.id));
      setFilteredProducers((prev) => prev.filter((p) => p.id !== selectedProducer.id));
    }
  };

  const handleProducerUpdated = (updatedProducer: Producer) => {
    setSelectedProducer(updatedProducer);
    setProducers((prev) =>
      prev.map((producer) =>
        producer.id === updatedProducer.id ? updatedProducer : producer,
      ),
    );
    setFilteredProducers((prev) =>
      prev.map((producer) =>
        producer.id === updatedProducer.id ? updatedProducer : producer,
      ),
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productores</h1>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Productor
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre, RUT, email o ciudad..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <ProducersDataGrid
        producers={filteredProducers}
        isLoading={isLoading}
        onAdd={handleAddClick}
        onView={handleViewClick}
        onDelete={handleDeleteClick}
      />

      <CreateProducerDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <DeleteProducerDialog
        open={deleteDialogOpen}
        producer={selectedProducer}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedProducer(null);
        }}
        onSuccess={handleDeleteSuccess}
      />

      <ProducerDetailDialog
        open={detailDialogOpen}
        producer={selectedProducer}
        onProducerUpdate={handleProducerUpdated}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedProducer(null);
        }}
      />
    </div>
  );
}
