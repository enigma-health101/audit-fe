// components/FileUpload.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
    onFilesUpload: (files: File[]) => void;
    uploadedFiles: File[];
    isDragOver: boolean;
    setIsDragOver: (isDragOver: boolean) => void;
}

export const FileUpload = ({
    onFilesUpload,
    uploadedFiles,
    isDragOver,
    setIsDragOver
}: FileUploadProps) => {
    const handleFileUpload = (files: File[]) => {
        onFilesUpload(files);
    };

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className={`
                relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-500 cursor-pointer
                ${isDragOver
                    ? 'border-blue-500 bg-blue-50 scale-105 shadow-2xl'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                }
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const files = Array.from(e.dataTransfer.files);
                handleFileUpload(files);
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
        >
            <motion.div
                animate={isDragOver ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
                className="mb-8"
            >
                <Upload className="mx-auto text-blue-500" size={80} />
            </motion.div>

            <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    handleFileUpload(files);
                }}
                className="hidden"
                id="file-upload"
            />

            <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Drop your Excel/CSV files here
            </h3>
            <p className="text-xl text-gray-600 mb-8">
                Supports .xlsx, .xls, and .csv formats • Maximum 16MB per file • HIPAA Compliant
            </p>

            <Button variant="primary" size="lg">
                <Upload size={24} />
                Browse Files
            </Button>

            {uploadedFiles.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 space-y-4"
                >
                    <h4 className="text-2xl font-bold text-gray-900 mb-6">Uploaded Files:</h4>
                    {uploadedFiles.map((file, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300"
                        >
                            <FileSpreadsheet className="text-emerald-500" size={24} />
                            <span className="flex-1 font-semibold text-gray-900 text-lg">{file.name}</span>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg font-medium">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
};