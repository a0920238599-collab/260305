import React from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

// I'll implement a simple drag and drop without the extra library to save a step, or just use a file input.
// Actually, a simple file input styled as a drop area is fine.

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div 
      className="w-full max-w-2xl mx-auto mt-10 p-12 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center justify-center text-center"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input 
        type="file" 
        id="file-upload" 
        className="hidden" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleFileChange}
      />
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
        <FileSpreadsheet size={32} />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">上传销售数据表格</h3>
      <p className="text-slate-500 mb-6">点击或拖拽 Excel 文件 (.xlsx, .xls) 到此处</p>
      <div className="text-xs text-slate-400 bg-white px-4 py-2 rounded border border-slate-200">
        <p>支持格式: B列=店铺名, Q列=SKU, X列=售出时间</p>
      </div>
    </div>
  );
}
