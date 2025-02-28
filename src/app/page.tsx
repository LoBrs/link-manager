'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink, Edit2, Trash2, QrCode } from 'lucide-react';
import FolderTree from '@/components/FolderTree';
import FolderSelect from '@/components/FolderSelect';
import { CopyShortUrl } from '@/components/CopyShortUrl';

interface Visit {
  id: string;
  linkId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

interface Link {
  id: string;
  url: string;
  title?: string;
  description?: string;
  qrCode?: string;
  favicon?: string;
  folderId?: string | null;
  createdAt: string;
  shortUrl: string;
  visits: Visit[];
  uniqueVisitsCount: number;
  visitsTrendPercentage: number;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  children: Folder[];
  _count?: { links: number };
}

export default function Home() {
  const { data: session } = useSession();
  const [links, setLinks] = useState<Link[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showingQRCode, setShowingQRCode] = useState<Link | null>(null);
  const [deletingLink, setDeletingLink] = useState<Link | null>(null);

  useEffect(() => {
    if (session) {
      fetchLinks();
      fetchFolders();
    }
  }, [session]);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links');
      if (!response.ok) throw new Error('Failed to fetch links');
      const data = await response.json();
      setLinks(data);
    } catch (err) {
      setError('Erreur lors de la récupération des liens');
      console.error('Error:', err);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setFolders(data);
    } catch (err) {
      setError('Erreur lors de la récupération des catégories');
      console.error('Error:', err);
    }
  };

  const handleCreateLink = async (formData: FormData) => {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.get('url'),
          title: formData.get('title'),
          description: formData.get('description'),
          folderId: selectedFolderId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create link');
      }

      await fetchLinks();
      await fetchFolders();
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du lien');
      console.error('Error:', err);
    }
  };

  const handleUpdateLink = async (formData: FormData) => {
    if (!editingLink) return;

    try {
      const newFolderId = formData.get('folderId') as string;
      const url = formData.get('url') as string;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;

      // Si seule la catégorie a changé, utiliser PATCH
      if (
        newFolderId !== editingLink.folderId &&
        url === editingLink.url &&
        title === editingLink.title &&
        description === editingLink.description
      ) {
        const response = await fetch(`/api/links/${editingLink.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId: newFolderId || null }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to move link');
        }
      } else {
        // Sinon, mettre à jour toutes les informations
        const response = await fetch(`/api/links/${editingLink.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            title,
            description,
            folderId: newFolderId || null
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update link');
        }
      }

      await fetchLinks();
      await fetchFolders();
      setEditingLink(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du lien');
      console.error('Error:', err);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete link');
      await fetchLinks();
      await fetchFolders();
    } catch (err) {
      setError('Erreur lors de la suppression du lien');
      console.error('Error:', err);
    }
  };

  const handleLinkClick = async (id: string) => {
    try {
      const response = await fetch(`/api/links/${id}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          windowSize: `${window.innerWidth}x${window.innerHeight}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record visit');
      }

      // Mettre à jour la liste des liens pour afficher le nouveau nombre de visites
      fetchLinks();
    } catch (err) {
      console.error('Error recording visit:', err);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Veuillez vous connecter pour gérer vos liens</p>
      </div>
    );
  }

  const filteredLinks = selectedFolderId
    ? links.filter(link => link.folderId === selectedFolderId)
    : links;

  const rootLinksCount = links.filter(link => !link.folderId).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar avec l'arborescence des dossiers */}
        <div className="col-span-3">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            rootLinksCount={rootLinksCount}
            onFolderCreated={(newFolder) => {
              setFolders((prevFolders) => [...prevFolders, { ...newFolder, children: [] }]);
            }}
          />
        </div>

        {/* Liste des liens */}
        <div className="col-span-9">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {selectedFolderId 
                ? `${folders.find(f => f.id === selectedFolderId)?.name || 'Catégorie'}`
                : 'Tous les liens'}
              <span className="text-sm text-gray-500 ml-2">
                ({filteredLinks.length} liens)
              </span>
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500"
            >
              Ajouter un lien
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {filteredLinks.map((link) => (
                <div key={link.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <img
                          src={link.favicon || '/images/default-favicon.png'}
                          alt=""
                          className="w-5 h-5 flex-shrink-0"
                        />
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {link.title || link.url}
                        </h3>
                        {link.description && (
                          <span className="text-sm text-gray-500 truncate hidden sm:inline">
                            • {link.description}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleLinkClick(link.id)}
                            className="truncate hover:text-indigo-600 hover:underline flex items-center"
                          >
                            {link.url}
                            <ExternalLink size={12} className="ml-1 flex-shrink-0" />
                          </a>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">
                            {link.uniqueVisitsCount} visite{link.uniqueVisitsCount !== 1 ? 's' : ''}
                            {link.uniqueVisitsCount > 0 && (
                              <span
                                className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                  link.visitsTrendPercentage > 0
                                    ? 'bg-green-100 text-green-800'
                                    : link.visitsTrendPercentage < 0
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                                title="Évolution sur 7 jours"
                              >
                                {link.visitsTrendPercentage > 0 ? '+' : ''}
                                {link.visitsTrendPercentage}%
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <CopyShortUrl shortUrl={link.shortUrl} />
                      <button
                        onClick={() => setShowingQRCode(link)}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                        title="Afficher le QR code"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        onClick={() => setEditingLink(link)}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingLink(link)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredLinks.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                Aucun lien dans cette catégorie
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {deletingLink && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300"
          onClick={() => setDeletingLink(null)}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-xl transform transition-all duration-300 scale-100 opacity-100"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '400px' }}
          >
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmer la suppression
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer le lien "{deletingLink.title || deletingLink.url}" ?
                Cette action est irréversible.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingLink(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    handleDeleteLink(deletingLink.id);
                    setDeletingLink(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showingQRCode && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300"
          onClick={() => setShowingQRCode(null)}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-xl transform transition-all duration-300 scale-100 opacity-100"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '300px' }}
          >
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">
                {showingQRCode.title || showingQRCode.url}
              </h3>
              <div className="bg-white p-4 inline-block rounded-lg">
                <QRCodeSVG
                  value={showingQRCode.url}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowingQRCode(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création/édition de lien */}
      {(isCreateModalOpen || editingLink) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingLink ? 'Modifier le lien' : 'Créer un lien'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (editingLink) {
                handleUpdateLink(formData);
              } else {
                handleCreateLink(formData);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    required
                    defaultValue={editingLink?.url}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Titre
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingLink?.title}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingLink?.description}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <FolderSelect
                    folders={folders}
                    selectedFolderId={editingLink?.folderId || selectedFolderId}
                    onSelect={(folderId) => {
                      const input = document.createElement('input');
                      input.type = 'hidden';
                      input.name = 'folderId';
                      input.value = folderId || '';
                      const oldInput = document.querySelector('input[name="folderId"]');
                      if (oldInput) {
                        oldInput.remove();
                      }
                      document.querySelector('form')?.appendChild(input);
                      if (!editingLink) {
                        setSelectedFolderId(folderId);
                      }
                    }}
                    onFolderCreated={(newFolder) => {
                      setFolders((prevFolders) => [...prevFolders, { ...newFolder, children: [] }]);
                      if (!editingLink) {
                        setSelectedFolderId(newFolder.id);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingLink(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  {editingLink ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
