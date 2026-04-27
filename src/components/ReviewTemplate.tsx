import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ReviewRecord } from '../types';
import { exportToCSV, importFromCSV } from '../utils/constants';

const today = new Date().toISOString().slice(0, 10);

export default function ReviewTemplate() {
  const { reviewRecords, addReviewRecord, deleteReviewRecord, updateReviewRecord, importReviewRecords } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyDate, setHistoryDate] = useState<string>(today);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<ReviewRecord, 'id'>>({
    code: '', name: '', firstSealTime: '09:30', openCount: 0,
    catalystLevel: 'B', sealAmountRatio: 5, notes: '', date: today,
  });

  const resetForm = () => {
    setForm({ code: '', name: '', firstSealTime: '09:30', openCount: 0, catalystLevel: 'B', sealAmountRatio: 5, notes: '', date: today });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    if (editingId) {
      updateReviewRecord({ ...form, id: editingId });
    } else {
      addReviewRecord({ ...form, id: Date.now().toString() });
    }
    resetForm();
  };

  const handleEdit = (r: ReviewRecord) => {
    setForm({ code: r.code, name: r.name, firstSealTime: r.firstSealTime, openCount: r.openCount, catalystLevel: r.catalystLevel, sealAmountRatio: r.sealAmountRatio, notes: r.notes, date: r.date });
    setEditingId(r.id);
  };

  const handleExport = () => {
    exportToCSV(reviewRecords.map(r => ({
      代码: r.code, 名称: r.name, 首封时间: r.firstSealTime,
      开板次数: r.openCount, 催化等级: r.catalystLevel,
      封单比: r.sealAmountRatio, 备注: r.notes, 日期: r.date,
    })), `复盘记录_${today}.csv`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importFromCSV(file);
      const records: ReviewRecord[] = rows.map((r: Record<string, string>) => ({
        id: Date.now().toString() + Math.random(),
        code: r['代码'] || r['code'] || '',
        name: r['名称'] || r['name'] || '',
        firstSealTime: r['首封时间'] || r['firstSealTime'] || '09:30',
        openCount: parseInt(r['开板次数'] || r['openCount'] || '0'),
        catalystLevel: (r['催化等级'] || r['catalystLevel'] || 'B') as ReviewRecord['catalystLevel'],
        sealAmountRatio: parseFloat(r['封单比'] || r['sealAmountRatio'] || '5'),
        notes: r['备注'] || r['notes'] || '',
        date: r['日期'] || r['date'] || today,
      })).filter(s => s.code && s.name);
      importReviewRecords(records);
      alert(`导入成功 ${records.length} 条`);
    } catch {
      alert('导入失败');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const displayedRecords = showHistory
    ? reviewRecords
    : reviewRecords.filter(r => r.date === today);

  const catalystOptions: ReviewRecord['catalystLevel'][] = ['S', 'A', 'B', 'C'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">📋 龙头复盘模板</h2>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={showHistory} onChange={e => setShowHistory(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600" />
            显示历史
          </label>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg">📥 导入</button>
          <button onClick={handleExport}
            className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg">📤 导出</button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">代码</label>
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm" placeholder="600519" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">名称</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm" placeholder="贵州茅台" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">首封时间</label>
            <input type="time" value={form.firstSealTime} onChange={e => setForm({ ...form, firstSealTime: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">开板次数</label>
            <input type="number" min="0" value={form.openCount} onChange={e => setForm({ ...form, openCount: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">催化等级</label>
            <select value={form.catalystLevel} onChange={e => setForm({ ...form, catalystLevel: e.target.value as ReviewRecord['catalystLevel'] })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm">
              {catalystOptions.map(c => <option key={c} value={c}>{c}级</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">封单/成交额比</label>
            <input type="number" step="0.1" value={form.sealAmountRatio} onChange={e => setForm({ ...form, sealAmountRatio: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">备注</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm" placeholder="..." />
          </div>
          <div className="col-span-full flex gap-2">
            {!showHistory && (
              <div className="space-y-1">
                <label className="text-xs text-slate-400">日期</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm" />
              </div>
            )}
            <div className="flex items-end gap-2">
              <button type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors">
                {editingId ? '更新' : '添加'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm}
                  className="px-4 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-white text-sm transition-colors">
                  取消
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">日期</th>
              <th className="px-3 py-2 text-left">代码</th>
              <th className="px-3 py-2 text-left">名称</th>
              <th className="px-3 py-2 text-left">首封</th>
              <th className="px-3 py-2 text-left">开板</th>
              <th className="px-3 py-2 text-left">等级</th>
              <th className="px-3 py-2 text-left">封单比</th>
              <th className="px-3 py-2 text-left">备注</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {displayedRecords.map(r => (
              <tr key={r.id} className="hover:bg-slate-700/30">
                <td className="px-3 py-2 text-slate-400 text-xs">{r.date}</td>
                <td className="px-3 py-2 font-mono text-blue-400">{r.code}</td>
                <td className="px-3 py-2 text-white">{r.name}</td>
                <td className="px-3 py-2 font-mono text-slate-300">{r.firstSealTime}</td>
                <td className="px-3 py-2 text-slate-300">{r.openCount}次</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    r.catalystLevel === 'S' ? 'bg-purple-900/50 text-purple-300' :
                    r.catalystLevel === 'A' ? 'bg-green-900/50 text-green-300' :
                    r.catalystLevel === 'B' ? 'bg-yellow-900/50 text-yellow-300' :
                    'bg-slate-700/50 text-slate-400'
                  }`}>{r.catalystLevel}级</span>
                </td>
                <td className="px-3 py-2 text-slate-300">{r.sealAmountRatio}</td>
                <td className="px-3 py-2 text-slate-400 max-w-xs truncate">{r.notes}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(r)}
                      className="px-2 py-0.5 text-xs bg-slate-600 hover:bg-slate-500 rounded transition-colors">编辑</button>
                    <button onClick={() => deleteReviewRecord(r.id)}
                      className="px-2 py-0.5 text-xs bg-red-900/50 hover:bg-red-800 text-red-300 rounded transition-colors">删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {displayedRecords.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-500">暂无记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
