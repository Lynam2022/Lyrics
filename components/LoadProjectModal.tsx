
import React from 'react';
import { SavedProject, Language } from '../types';
import { TrashIcon, FolderOpenIcon } from './icons';

interface LoadProjectModalProps {
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (projectId: string) => void;
  onClose: () => void;
  language: Language;
}

const TEXT = {
    vn: {
        title: "Thư Viện Dự Án",
        subtitle: "Quản lý các sáng tác của bạn",
        emptyTitle: "Thư viện trống.",
        emptySub: "Hãy lưu bài hát đầu tiên của bạn để xem tại đây.",
        deleteTitle: "Xóa dự án",
        load: "Tải / Load",
        plus: "+"
    },
    en: {
        title: "Project Library",
        subtitle: "Manage your creations",
        emptyTitle: "Your library is empty.",
        emptySub: "Save your first song to see it here.",
        deleteTitle: "Delete Project",
        load: "Load",
        plus: "+"
    }
};

const LoadProjectModal: React.FC<LoadProjectModalProps> = ({ projects, onLoad, onDelete, onClose, language }) => {
  const t = TEXT[language];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        
        <div className="p-6 border-b border-gray-800 bg-gray-900 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
              <div className="bg-teal-900/30 p-2.5 rounded-xl">
                  <FolderOpenIcon className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                  <h2 className="text-xl font-extrabold text-gray-100 tracking-tight">{t.title}</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-0.5">{t.subtitle}</p>
              </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-3xl leading-none p-2">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar bg-black/20 flex-1">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <FolderOpenIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-xl font-bold text-gray-400">{t.emptyTitle}</p>
                <p className="text-sm mt-1 opacity-60">{t.emptySub}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map(project => (
                <div 
                    key={project.id} 
                    className="group relative bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 hover:bg-gray-800 hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between min-h-[150px] shadow-md hover:shadow-lg"
                >
                   <div>
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-lg text-gray-100 group-hover:text-teal-300 transition-colors line-clamp-1 tracking-tight" title={project.name}>
                                 {project.name}
                             </h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-5">
                            {project.genres.slice(0, 3).map((g, idx) => (
                                <span key={idx} className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-gray-700/60 text-gray-300 border border-gray-600/50">
                                    {g}
                                </span>
                            ))}
                            {project.genres.length > 3 && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-700/60 text-gray-400">{t.plus}{project.genres.length - 3}</span>
                            )}
                        </div>
                   </div>

                   <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-700/30">
                        <div className="text-[11px] text-gray-500 font-mono font-medium">
                            {new Date(project.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                             <button
                                onClick={() => onDelete(project.id)}
                                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-500/20"
                                title={t.deleteTitle}
                             >
                                <TrashIcon className="w-4 h-4" />
                             </button>
                             <button
                                onClick={() => onLoad(project)}
                                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-teal-600 text-white hover:bg-teal-500 shadow-lg hover:shadow-teal-500/25 transition-all ring-1 ring-white/10"
                             >
                                {t.load}
                             </button>
                        </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadProjectModal;
