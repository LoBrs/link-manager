'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  description?: string;
  children?: Folder[];
  _count?: { links: number };
}

interface FolderSelectProps {
  folders: Folder[];
  selectedFolderId?: string | null;
  onSelect: (folderId: string | null) => void;
  onFolderCreated?: (folder: Folder) => void;
}

export default function FolderSelect({
  folders,
  selectedFolderId,
  onSelect,
  onFolderCreated
}: FolderSelectProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [localSelectedId, setLocalSelectedId] = useState(selectedFolderId);

  // Mettre à jour la sélection locale quand la prop change
  useEffect(() => {
    setLocalSelectedId(selectedFolderId);
  }, [selectedFolderId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Le nom de la catégorie est requis');
      return;
    }

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create folder');
      }

      const newFolder = await response.json();
      setNewFolderName('');
      setIsCreating(false);
      setError(null);
      setLocalSelectedId(newFolder.id);
      onSelect(newFolder.id);
      
      if (onFolderCreated) {
        onFolderCreated(newFolder);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la catégorie');
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      
      {isCreating ? (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nom de la catégorie"
            className="px-2 py-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateFolder();
              } else if (e.key === 'Escape') {
                setIsCreating(false);
                setNewFolderName('');
                setError(null);
              }
            }}
            autoFocus
          />
          <button
            onClick={() => {
              setIsCreating(false);
              setNewFolderName('');
              setError(null);
            }}
            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            Annuler
          </button>
          <button
            onClick={handleCreateFolder}
            className="px-2 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Créer
          </button>
        </div>
      ) : (
        <div className="relative">
          <select
            value={localSelectedId || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'new') {
                setIsCreating(true);
              } else {
                setLocalSelectedId(value || null);
                onSelect(value || null);
              }
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
          >
            <option value="">Sans catégorie</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name} {folder._count && `(${folder._count.links})`}
              </option>
            ))}
            <option value="new" className="text-indigo-600 font-medium">
              + Nouvelle catégorie
            </option>
          </select>
        </div>
      )}
    </div>
  );
} 