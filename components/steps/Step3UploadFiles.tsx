// components/steps/Step3UploadFiles.tsx
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface Step3Props {
    uploadedFiles: File[];
    isDragOver: boolean;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}

export default function Step3UploadFiles({
    uploadedFiles,
    isDragOver,
    onFileUpload,
    onDragOver,
    onDragLeave,
    onDrop
}: Step3Props) {
    return (
        <div className="glass-card p-8 bg-gradient-to-br from-orange-500/5 to-red-500/5">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                    <span className="text-white font-bold text-xl">3</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Upload Patient Data</h2>
                    <p className="text-gray-600">Drop your Excel files or click to browse</p>
                </div>
            </div>

            <motion.div
                whileHover={{ scale: 1.01 }}
                className={`
                    relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md
                    ${isDragOver
                        ? 'border-orange-400 bg-orange-50 scale-105 shadow-lg'
                        : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50/50'
                    }
                `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <motion.div
                    animate={isDragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                    className="mb-6"
                >
                    <Upload className="mx-auto text-orange-400" size={64} />
                </motion.div>

                <input
                    type="file"
                    multiple
                    accept=".xlsx,.xls"
                    onChange={onFileUpload}
                    className="hidden"
                    id="file-upload"
                />

                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Drop your Excel files here
                </h3>
                <p className="text-gray-600 mb-6">
                    Supports .xlsx and .xls formats • Maximum 16MB per file
                </p>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="btn-primary flex items-center gap-2"
                >
                    <Upload size={20} />
                    Browse Files
                </motion.button>

                {uploadedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 space-y-3"
                    >
                        <h4 className="font-semibold text-gray-700 mb-4">Uploaded Files:</h4>
                        {uploadedFiles.map((file, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <FileSpreadsheet className="text-emerald-500" size={20} />
                                <span className="flex-1 text-gray-700 font-medium">{file.name}</span>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}