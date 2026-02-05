import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Calendar, Image as ImageIcon, Cloud, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getHistory, clearHistory } from '../services/history';
import { saveImageToDrive } from '../services/google-drive';

const HistoryItem = ({ item }) => {
    const [status, setStatus] = useState('idle'); // idle, saving, success, error

    const handleSave = async () => {
        setStatus('saving');
        try {
            await saveImageToDrive(item.image, `vto-history-${item.id}.png`);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error("Manual Drive save failed", err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group relative">
            <div className="relative aspect-[3/4] bg-gray-100">
                <img src={item.image} alt="Generated" className="w-full h-full object-cover" />
                
                {/* Save Button Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleSave}
                        disabled={status === 'saving'}
                        className={`p-3 rounded-xl shadow-lg transition-all active:scale-90 ${
                            status === 'success' ? 'bg-green-500 text-white' : 
                            status === 'error' ? 'bg-red-500 text-white' : 
                            'bg-white text-slate-600 hover:bg-brand-purple hover:text-white'
                        }`}
                    >
                        {status === 'saving' ? <RefreshCw size={18} className="animate-spin" /> : 
                         status === 'success' ? <CheckCircle2 size={18} /> : 
                         <Cloud size={18} />}
                    </button>
                </div>
            </div>
            <div className="p-4 flex justify-between items-center text-sm text-gray-500 bg-gray-50">
                <span className="flex items-center gap-1">
                    <Calendar size={14} /> {new Date(item.timestamp).toLocaleDateString()}
                </span>
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
        </div>
    );
};

const HistoryPage = () => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    setImages(getHistory());
  }, []);

  const handleClear = () => {
      if (confirm("Clear all history?")) {
          clearHistory();
          setImages([]);
      }
  };

  return (
    <div className="p-8 h-full">
      <div className="max-w-6xl mx-auto">
        {images.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-500">No history yet</h3>
                <p className="text-gray-400 mt-2">Generated images will appear here.</p>
                <Link to="/" className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Start Designing
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((item) => (
                    <HistoryItem key={item.id} item={item} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
