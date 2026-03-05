import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';
import { Filter, ArrowUpRight, TrendingUp, ShoppingBag, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

interface SKUData {
  sku: string;
  shopName: string;
  last30DaysSales: number;
  growthRatio: number; // (Last 7 Days) / (Previous 21 Days)
  last7DaysSales: number;
  previous21DaysSales: number;
}

interface DashboardProps {
  data: SKUData[];
  onReset: () => void;
}

export function Dashboard({ data, onReset }: DashboardProps) {
  const [minVolume, setMinVolume] = useState<number>(10);
  const [minGrowth, setMinGrowth] = useState<number>(2.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered data for the list
  const filteredData = useMemo(() => {
    return data.filter(item => item.last30DaysSales >= minVolume && item.growthRatio >= minGrowth);
  }, [data, minVolume, minGrowth]);

  // Sort by growth ratio for the list
  const sortedFilteredData = useMemo(() => {
    return [...filteredData].sort((a, b) => b.growthRatio - a.growthRatio);
  }, [filteredData]);

  // Pagination logic
  const totalPages = Math.ceil(sortedFilteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFilteredData.slice(start, start + pageSize);
  }, [sortedFilteredData, currentPage, pageSize]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [minVolume, minGrowth, pageSize]);

  const handleExport = () => {
    const exportData = sortedFilteredData.map(item => ({
      'SKU': item.sku,
      '店铺名': item.shopName,
      '近30天销量': item.last30DaysSales,
      '增长倍率': Number(item.growthRatio.toFixed(2)),
      '近7天销量': item.last7DaysSales,
      '前21天销量': item.previous21DaysSales
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Data");
    XLSX.writeFile(wb, "sku_analysis_export.xlsx");
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const isSelected = item.last30DaysSales >= minVolume && item.growthRatio >= minGrowth;
      return (
        <div className={clsx(
          "bg-white p-4 border shadow-lg rounded-lg text-sm",
          isSelected ? "border-emerald-200" : "border-slate-200"
        )}>
          <p className="font-bold text-slate-800 mb-1">{item.sku}</p>
          <p className="text-slate-500 text-xs mb-2">{item.shopName}</p>
          <div className="space-y-1">
            <p className="flex justify-between gap-4">
              <span className="text-slate-500">近30天销量:</span>
              <span className="font-mono font-medium">{item.last30DaysSales}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-500">增长倍率:</span>
              <span className={clsx("font-mono font-medium", isSelected ? "text-emerald-600" : "text-slate-600")}>
                {item.growthRatio.toFixed(2)}x
              </span>
            </p>
            <div className="border-t border-slate-100 my-1 pt-1 text-xs text-slate-400">
              <p>近7天: {item.last7DaysSales} | 前21天: {item.previous21DaysSales}</p>
            </div>
            {!isSelected && (
              <p className="text-xs text-amber-500 mt-1 italic">未达到筛选标准</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            SKU 销量增长分析
          </h1>
          <p className="text-slate-500 mt-1">
            共分析 {data.length} 个 SKU，筛选出 {filteredData.length} 个潜在爆款
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            导出结果
          </button>
          <button 
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            重新上传
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-medium">
          <Filter size={18} />
          <span>筛选条件 (用于高亮显示和列表筛选)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm text-slate-600 font-medium">最小订单量 (近30天)</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                min="0" 
                value={minVolume} 
                onChange={(e) => setMinVolume(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <span className="text-slate-400 text-sm whitespace-nowrap">单</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600 font-medium">最小增长倍率 (近7天/前21天)</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                min="0" 
                step="0.1"
                value={minGrowth} 
                onChange={(e) => setMinGrowth(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
              <span className="text-slate-400 text-sm whitespace-nowrap">倍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart - Full Width */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[600px] flex flex-col">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">增长趋势分布图 (全量数据)</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="last30DaysSales" 
                name="近30天销量" 
                unit="单" 
                label={{ value: '近30天销量', position: 'bottom', offset: 0 }}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis 
                type="number" 
                dataKey="growthRatio" 
                name="增长倍率" 
                unit="x" 
                label={{ value: '增长倍率', angle: -90, position: 'left' }}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="SKUs" data={data} fill="#94a3b8" fillOpacity={0.5}>
                {data.map((entry, index) => {
                  const isSelected = entry.last30DaysSales >= minVolume && entry.growthRatio >= minGrowth;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isSelected ? '#10b981' : '#94a3b8'} 
                      fillOpacity={isSelected ? 0.8 : 0.3}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400 opacity-30"></div>
            <span>未达标 SKU</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-80"></div>
            <span>符合筛选条件</span>
          </div>
        </div>
      </div>

      {/* Top List - Moved Below */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ArrowUpRight className="text-emerald-500" />
            飙升榜单 (符合条件: {sortedFilteredData.length})
          </h3>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>每页显示:</span>
              <select 
                value={pageSize} 
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-slate-600 min-w-[4rem] text-center">
                {currentPage} / {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {paginatedData.length === 0 ? (
            <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              暂无符合条件的数据，请调整筛选条件
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedData.map((item, idx) => (
                <div key={`${item.sku}-${idx}`} className="p-4 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group bg-white shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-slate-800 truncate flex-1 pr-2" title={item.sku}>
                      <span className="text-xs text-slate-400 mr-1">#{(currentPage - 1) * pageSize + idx + 1}</span>
                      {item.sku}
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                      +{item.growthRatio.toFixed(1)}x
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>店铺:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[120px]" title={item.shopName}>{item.shopName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>30天销量:</span>
                      <span className="font-mono">{item.last30DaysSales}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-1 mt-1">
                      <span>近7天: {item.last7DaysSales}</span>
                      <span>前21天: {item.previous21DaysSales}</span>
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
}
