import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Navigation, { Tab } from './components/Navigation';
import Dashboard from './components/Dashboard';
import MarketScoring from './components/MarketScoring';
import ZtPool from './components/ZtPool';
import SectorAnalysis from './components/SectorAnalysis';
import BoardingTiers from './components/BoardingTiers';
import StockFilter from './components/StockFilter';
import ReviewTemplate from './components/ReviewTemplate';
import './index.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'scoring': return <MarketScoring />;
      case 'ztpool': return <ZtPool />;
      case 'sector': return <SectorAnalysis />;
      case 'tiers': return <BoardingTiers />;
      case 'filter': return <StockFilter />;
      case 'review': return <ReviewTemplate />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">📈 A股打板复盘系统</h1>
            <p className="text-xs text-slate-400 mt-0.5">短线涨停板复盘与筛选工具</p>
          </div>
          <div className="text-xs text-slate-500">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}
          </div>
        </div>
      </header>
      <Navigation active={activeTab} onChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderTab()}
      </main>
      <footer className="text-center text-xs text-slate-600 py-4 border-t border-slate-800 mt-8">
        A股打板复盘系统 · 仅供个人复盘参考，不构成投资建议
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
