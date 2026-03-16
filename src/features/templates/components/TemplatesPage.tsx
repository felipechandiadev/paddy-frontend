'use client';

import React, { useState } from 'react';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { Template } from '../types/templates.types';
import TemplateCard from './TemplateCard';
import TemplatesSearchBar from './TemplatesSearchBar';
import CreateTemplateDialog from './CreateTemplateDialog';
import UpdateTemplateDialog from './UpdateTemplateDialog';
import DeleteTemplateDialog from './DeleteTemplateDialog';

interface TemplatesPageProps {
  initialData: Template[];
  searchParams?: Record<string, string>;
}

export default function TemplatesPage({
  initialData,
  searchParams = {},
}: TemplatesPageProps) {
  const [templates, setTemplates] = useState(initialData);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const searchQuery = (searchParams.search || '').toLowerCase();
  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery)
  );

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setUpdateDialogOpen(true);
  };

  const handleDelete = (template: Template) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-8 px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Plantillas</h1>
        <p className="mt-2 text-gray-600">
          Gestiona las plantillas de análisis del sistema
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <IconButton
          icon="add"
          variant="ghost"
          onClick={() => setCreateDialogOpen(true)}
          title="Agregar nueva plantilla"
        />
        <div className="flex-1 max-w-md">
          <TemplatesSearchBar />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            {searchQuery
              ? 'No se encontraron plantillas'
              : 'No hay plantillas disponibles'}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleRefresh}
      />

      <UpdateTemplateDialog
        open={updateDialogOpen}
        template={selectedTemplate}
        onClose={() => {
          setUpdateDialogOpen(false);
          setSelectedTemplate(null);
        }}
        onSuccess={handleRefresh}
      />

      <DeleteTemplateDialog
        open={deleteDialogOpen}
        template={selectedTemplate}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedTemplate(null);
        }}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
