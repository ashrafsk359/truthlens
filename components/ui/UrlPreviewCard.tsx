import { ExternalLink, Globe } from 'lucide-react'
import type { ArticleMeta } from '@/types'

interface Props {
  meta: ArticleMeta
  url: string
}

export default function UrlPreviewCard({ meta, url }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all group"
    >
      {/* Favicon */}
      <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {meta.faviconUrl ? (
          <img src={meta.faviconUrl} alt={meta.domain} width={20} height={20} className="rounded" onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
        ) : (
          <Globe className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{meta.domain}</p>
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
          {meta.title || url}
        </p>
        {(meta.author || meta.publishDate) && (
          <p className="text-xs text-gray-400 mt-1">
            {meta.author && <span>{meta.author}</span>}
            {meta.author && meta.publishDate && <span className="mx-1">·</span>}
            {meta.publishDate && <span>{meta.publishDate.substring(0, 10)}</span>}
            {meta.wordCount > 0 && <span className="ml-2 text-gray-300">~{meta.wordCount} words</span>}
          </p>
        )}
        {meta.excerpt && (
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{meta.excerpt}</p>
        )}
      </div>

      {/* Thumbnail */}
      {meta.imageUrl && (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 hidden sm:block">
          <img src={meta.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display='none' }} />
        </div>
      )}

      <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 flex-shrink-0 self-start mt-0.5 transition-colors" />
    </a>
  )
}
