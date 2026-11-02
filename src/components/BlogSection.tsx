import React, { useState } from 'react';
import { Article } from '../types';
import { useApp } from '../context/AppContext';
import { BookOpen, Calendar, Clock, ArrowRight, User, X } from 'lucide-react';

interface BlogSectionProps {
  articles: Article[];
}

export const BlogSection: React.FC<BlogSectionProps> = ({ articles }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <section className="py-16 bg-white min-h-[85vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Panduan & Tips Belanja Grosir
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            Wawasan Bisnis Pasar Aur Kuning Bukittinggi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Pelajari jadwal hari pasar, trik mendapatkan harga grosir termurah, dan panduan memilih konveksi terpercaya
          </p>
        </div>

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((art) => (
            <article
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="group bg-slate-50 hover:bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="aspect-16/9 w-full bg-slate-200 overflow-hidden">
                  <img
                    src={art.coverImage}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                    <span className="text-orange-600 font-semibold">{art.tags?.[0]}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.readTime}
                    </span>
                  </div>

                  <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h2>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs font-semibold text-blue-900 group-hover:text-orange-600 transition-colors">
                <span>Baca Selengkapnya</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </article>
          ))}
        </div>

        {/* Article Detail Modal / Reader */}
        {selectedArticle && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto my-6">
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-16/9 w-full rounded-xl overflow-hidden mb-6 bg-slate-100">
                <img
                  src={selectedArticle.coverImage}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                <span className="text-orange-600 font-bold uppercase">{selectedArticle.tags?.join(', ')}</span>
                <span>·</span>
                <span>{selectedArticle.readTime}</span>
                <span>·</span>
                <span>Oleh {selectedArticle.author}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6 leading-tight">
                {selectedArticle.title}
              </h1>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
                {selectedArticle.content}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Tutup Artikel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
