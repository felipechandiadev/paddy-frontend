'use client';

import { useState, useEffect } from 'react';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import UsersSearchBar from './UsersSearchBar';
import UserCard from './UserCard';
import CreateUserDialog from './CreateUserDialog';
import UpdateUserDialog from './UpdateUserDialog';
import DeleteUserDialog from './DeleteUserDialog';
import UserPermissionsDialog from './UserPermissionsDialog';
import { User } from '../types/users.types';

interface UsersPageProps {
  initialUsers: User[];
}

export default function UsersPage({ initialUsers }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Sincronizar usuarios cuando cambien los initialUsers (búsqueda o crear/editar/eliminar)
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleManagePermissions = (user: User) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };

  return (
    <div className="w-full">
      {/* Header con búsqueda y botón crear */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <IconButton
          icon="add"
          variant="ghost"
          onClick={() => setCreateDialogOpen(true)}
          title="Crear nuevo usuario"
        />
        <UsersSearchBar />
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {users.length > 0 ? (
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManagePermissions={handleManagePermissions}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-neutral-500 py-12">
            <p className="text-lg">No se encontraron usuarios</p>
            <p className="text-sm">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>

      {/* Diálogos */}
      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
      <UpdateUserDialog
        open={editDialogOpen}
        user={selectedUser}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedUser(null);
        }}
      />
      <DeleteUserDialog
        open={deleteDialogOpen}
        user={selectedUser}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
      />
      <UserPermissionsDialog
        open={permissionsDialogOpen}
        user={selectedUser}
        onClose={() => {
          setPermissionsDialogOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
