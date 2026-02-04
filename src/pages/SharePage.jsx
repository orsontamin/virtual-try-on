import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, Sparkles, Scissors, ArrowLeft, ExternalLink } from 'lucide-react';

const SharePage = () => {
    const { id } = useParams();
    // Google Drive direct link for public files
    const imageUrl = `https://lh3.googleusercontent.com/d/${id}`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;

    return (
        <div className="min-h-screen bg-soft-white flex flex-col font-sans selection:bg-u-orange/20">
            <header className="p-6 max-w-7xl mx-auto w-full flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-[20px] flex items-center justify-center text-white shadow-xl">
                        <Sparkles size={20} />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter text-slate-900">VTO.<span className="text-brand-purple">AI</span></h1>
                </div>
                <Link to="/" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition">
                    Start Your Own
                </Link>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-700">
                    <div className="relative group">
                        {/* Aesthetic Backdrop */}
                        <div className="absolute -inset-10 bg-gradient-to-tr from-purple-100 via-pink-100 to-amber-100 rounded-[80px] blur-3xl opacity-50 pointer-events-none"></div>
                        
                        {/* Image Container */}
                        <div className="relative rounded-[60px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.2)] border-[12px] border-white bg-white">
                            <img 
                                src={imageUrl} 
                                alt="Your Transformation" 
                                className="w-full h-auto object-contain"
                                onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/800x1000?text=Image+Loading...";
                                }}
                            />
                        </div>
                    </div>

                    <div className="mt-12 space-y-6 text-center">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Ready for <span className="text-brand-purple">Prime Time.</span></h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your AI transformation is complete</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a 
                                href={downloadUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-6 bg-slate-900 text-white rounded-[32px] font-black text-xl hover:bg-brand-purple transition shadow-xl flex items-center justify-center gap-3 px-12"
                            >
                                <Download size={24} /> DOWNLOAD
                            </a>
                            <button 
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'My AI Transformation',
                                            url: window.location.href
                                        });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert("Link copied to clipboard!");
                                    }
                                }}
                                className="py-6 px-10 bg-white border-2 border-slate-100 text-slate-900 rounded-[32px] font-black hover:bg-slate-50 transition flex items-center justify-center gap-3"
                            >
                                <Share2 size={24} /> SHARE
                            </button>
                        </div>
                        
                        <div className="pt-8">
                           <a 
                                href={`https://drive.google.com/file/d/${id}/view`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition"
                           >
                               View on Google Drive <ExternalLink size={12} />
                           </a>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="p-8 text-center border-t border-slate-100">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    Powered by EventzFlow AI &copy; 2026
                </p>
            </footer>
        </div>
    );
};

export default SharePage;
