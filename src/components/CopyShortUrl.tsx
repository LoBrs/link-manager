import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyShortUrlProps {
  shortUrl: string;
}

export function CopyShortUrl({ shortUrl }: CopyShortUrlProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Extraire uniquement la partie finale de l'URL
  const shortId = shortUrl.split('/').pop() || shortUrl;

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 border border-gray-200 rounded-full px-2 py-0.5 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-gray-50"
      title={copied ? 'Copié !' : 'Copier le lien court'}
    >
      <span className="text-xs font-mono">/{shortId}</span>
      {copied ? (
        <Check size={12} className="text-green-500" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
} 