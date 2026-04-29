import { Search, ArrowUpRight, Newspaper } from 'lucide-react'

interface Props {
  searchUrl: string      // primary Google search URL — always populated
  newsUrl?: string       // optional Google News URL
  topic: string
}

export default function FindMoreSection({ searchUrl, newsUrl, topic }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-0.5">Find more about this</h3>
      {topic && (
        <p className="text-xs text-gray-400 mb-3">
          Searching: <span className="text-gray-600 font-medium">"{topic}"</span>
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Primary — Google Web Search */}
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-between gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors group"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Find more about this
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
        </a>

        {/* Secondary — Google News */}
        {newsUrl && (
          <a
            href={newsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-between gap-2 px-4 py-3 border border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl text-sm font-medium transition-all group"
          >
            <span className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Latest news
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
          </a>
        )}
      </div>
    </div>
  )
}
