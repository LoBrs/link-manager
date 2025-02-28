import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder as FolderIcon, Plus } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  children?: Folder[];
  _count?: { links: number };
}

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  rootLinksCount?: number;
  onFolderCreated?: (folder: Folder) => void;
}

interface FolderNodeProps extends Omit<FolderTreeProps, 'rootLinksCount'> {
  folder: Folder;
  level: number;
}

const FolderNode = ({ folder, selectedFolderId, onSelect, level }: FolderNodeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = folder.id === selectedFolderId;
  const linkCount = folder._count?.links || 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
          isSelected ? 'bg-indigo-50 text-indigo-600' : ''
        }`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="w-8" />
        )}
        <FolderIcon size={16} className="mr-2" />
        <span className="flex-1">{folder.name}</span>
        {linkCount > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {linkCount}
          </span>
        )}
      </div>
      {isOpen && hasChildren && folder.children && (
        <div>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              level={level + 1}
              folders={[]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FolderTree({ folders, selectedFolderId, onSelect, rootLinksCount = 0, onFolderCreated }: FolderTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(data.error || 'Échec de la création du dossier');
      }

      const newFolder = await response.json();
      setNewFolderName('');
      setIsCreating(false);
      setError(null);
      
      if (onFolderCreated) {
        onFolderCreated(newFolder);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la catégorie');
    }
  };

  const resetCreationState = () => {
    setIsCreating(false);
    setNewFolderName('');
    setError(null);
  };

  return (
    <div className="border rounded-lg p-2 bg-white">
      <div
        className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 mb-2 ${
          !selectedFolderId ? 'bg-indigo-50 text-indigo-600' : ''
        }`}
        onClick={() => onSelect(null)}
      >
        <FolderIcon size={16} className="mr-2" />
        <span className="flex-1">Tous les liens</span>
        {rootLinksCount > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {rootLinksCount}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        {folders && folders.length > 0 ? (
          folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              level={0}
              folders={folders}
            />
          ))
        ) : (
          <div className="text-gray-500 text-sm p-2">Aucune catégorie</div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        {isCreating ? (
          <div className="space-y-2">
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nom de la catégorie"
                className="block w-full text-sm rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateFolder();
                  } else if (e.key === 'Escape') {
                    resetCreationState();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={resetCreationState}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateFolder}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Créer
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center w-full px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded hover:bg-gray-50"
          >
            <Plus size={16} className="mr-1" />
            Nouvelle catégorie
          </button>
        )}
      </div>
    </div>
  );
} 