/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

interface SKUData {
  sku: string;
  shopName: string;
  last30DaysSales: number;
  growthRatio: number;
  last7DaysSales: number;
  previous21DaysSales: number;
}

export default function App() {
  const [data, setData] = useState<SKUData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON array of arrays (header: 1 means array of arrays)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error("表格数据为空或格式不正确");
      }

      // Find the max date in the dataset to serve as "Today"
      // Column X is index 23 (0-based)
      const dateColumnIndex = 23;
      const skuColumnIndex = 16; // Q
      const shopColumnIndex = 1; // B

      let maxDate = 0;
      const validRows: any[] = [];

      // First pass: find max date and filter valid rows
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[skuColumnIndex]) continue; // Skip if no SKU

        const dateVal = row[dateColumnIndex];
        let timestamp = 0;

        if (dateVal instanceof Date) {
          timestamp = dateVal.getTime();
        } else if (typeof dateVal === 'number') {
           // Excel date number (days since 1900-01-01)
           // Approx conversion if not handled by cellDates: true
           // But since we used cellDates: true, it should be a Date object if formatted correctly in Excel.
           // Fallback for raw numbers just in case
           const excelEpoch = new Date(1899, 11, 30).getTime();
           timestamp = excelEpoch + dateVal * 86400000;
        } else if (typeof dateVal === 'string') {
          const parsed = Date.parse(dateVal);
          if (!isNaN(parsed)) timestamp = parsed;
        }

        if (timestamp > 0) {
          if (timestamp > maxDate) maxDate = timestamp;
          validRows.push({
            sku: String(row[skuColumnIndex]).trim(),
            shopName: String(row[shopColumnIndex] || 'Unknown').trim(),
            timestamp: timestamp
          });
        }
      }

      if (maxDate === 0) {
        throw new Error("无法在X列找到有效的日期数据");
      }

      // Define time ranges
      const dayMs = 86400000;
      const last7DaysStart = maxDate - (7 * dayMs);
      const last30DaysStart = maxDate - (30 * dayMs);
      const previous21DaysStart = maxDate - (28 * dayMs); // 28 days ago
      // Range 1: Last 7 days: (maxDate - 7d) to maxDate
      // Range 2: Previous 21 days: (maxDate - 28d) to (maxDate - 7d)
      // Range 3: Last 30 days: (maxDate - 30d) to maxDate

      // Aggregate data by SKU
      const skuMap = new Map<string, { 
        shopName: string, 
        last7: number, 
        prev21: number, 
        last30: number 
      }>();

      validRows.forEach(row => {
        if (!skuMap.has(row.sku)) {
          skuMap.set(row.sku, { shopName: row.shopName, last7: 0, prev21: 0, last30: 0 });
        }
        const entry = skuMap.get(row.sku)!;

        // Check ranges
        // Note: We use >= start and <= end logic
        
        // Last 30 Days
        if (row.timestamp > last30DaysStart) {
          entry.last30++;
        }

        // Last 7 Days
        if (row.timestamp > last7DaysStart) {
          entry.last7++;
        }

        // Previous 21 Days (Day -28 to Day -7)
        if (row.timestamp > previous21DaysStart && row.timestamp <= last7DaysStart) {
          entry.prev21++;
        }
      });

      // Convert to array and calculate ratios
      const results: SKUData[] = [];
      skuMap.forEach((val, key) => {
        let ratio = 0;
        if (val.prev21 === 0) {
          if (val.last7 > 0) ratio = val.last7; // If no previous sales, ratio is the sales count (infinite growth sort of)
          else ratio = 0;
        } else {
          ratio = val.last7 / val.prev21;
        }

        results.push({
          sku: key,
          shopName: val.shopName,
          last30DaysSales: val.last30,
          growthRatio: ratio,
          last7DaysSales: val.last7,
          previous21DaysSales: val.prev21
        });
      });

      setData(results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "解析文件时出错");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-slate-900">
            Analytics<span className="text-blue-600">Pro</span>
          </div>
          <div className="text-sm text-slate-500">
            电商数据分析助手
          </div>
        </div>
      </nav>

      <main>
        {!data ? (
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">上传您的销售数据</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                我们将自动分析您的订单数据，帮您找出近期销量激增的潜力爆款。
                <br />
                <span className="text-sm text-slate-400 mt-2 block">
                  (数据仅在本地浏览器处理，不会上传到服务器)
                </span>
              </p>
            </div>
            
            <FileUpload onFileUpload={processFile} />

            {loading && (
              <div className="mt-8 flex flex-col items-center justify-center text-blue-600">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>正在分析数据...</p>
              </div>
            )}

            {error && (
              <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 max-w-md mx-auto text-center">
                {error}
              </div>
            )}
          </div>
        ) : (
          <Dashboard data={data} onReset={() => setData(null)} />
        )}
      </main>
    </div>
  );
}

