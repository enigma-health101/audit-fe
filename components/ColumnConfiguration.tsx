// Add useCallback to the import from 'react'
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Eye, Settings, ChevronUp, ChevronDown, Target, Brain,
    AlertCircle, Check, FileSpreadsheet
} from 'lucide-react';
import { Comorbidity, FileMetadata, ColumnMapping } from '../types';

interface ColumnConfigurationProps {
    files: File[];
    comorbidities: Comorbidity[];
    onConfigurationChange: (config: FileMetadata[]) => void;
}

export const ColumnConfiguration = ({
    files,
    comorbidities,
    onConfigurationChange
}: ColumnConfigurationProps) => {
    const [filesMetadata, setFilesMetadata] = useState<FileMetadata[]>([]);
    const [expandedFiles, setExpandedFiles] = useState<{ [key: string]: boolean }>({});
    const [expandedColumns, setExpandedColumns] = useState<{ [key: string]: boolean }>({});
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- FIX STARTS HERE ---

    // Wrap the analyzeFiles function in useCallback
    const analyzeFiles = useCallback(async () => {
        console.log('🔍 Starting file analysis for', files.length, 'files');
        setLoading(true);

        try {
            const analysisPromises = files.map(async (file) => {
                console.log('Analyzing file:', file.name);
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await Promise.race([
                        fetch('/api/analyze-file-structure', {
                            method: 'POST',
                            body: formData
                        }),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Request timeout')), 30000)
                        )
                    ]);

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Failed to analyze ${file.name}: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();

                    if (!data.columns || !Array.isArray(data.columns)) {
                        throw new Error(`Invalid response structure for ${file.name}`);
                    }

                    const columnMappings: ColumnMapping[] = data.columns.map((column: string) => ({
                        columnName: column,
                        isEnabled: shouldAutoEnableColumn(column),
                        selectedComorbidities: [],
                        customPrompt: generateDefaultPrompt(column),
                        sampleData: data.sampleDataByColumn?.[column] || []
                    }));

                    return {
                        fileName: file.name,
                        columns: data.columns,
                        sampleData: data.sampleData || [],
                        detectedHeaderRow: data.detectedHeaderRow || 0,
                        totalRows: data.totalRows || 0,
                        columnMappings
                    };
                } catch (fileError) {
                    console.error('Error analyzing file', file.name, ':', fileError);
                    return {
                        fileName: file.name,
                        columns: [`Column 1 (${file.name})`],
                        sampleData: [], detectedHeaderRow: 0, totalRows: 0,
                        columnMappings: [{
                            columnName: `Column 1 (${file.name})`,
                            isEnabled: false, selectedComorbidities: [],
                            customPrompt: 'Unable to analyze file structure. Please configure manually.',
                            sampleData: []
                        }]
                    };
                }
            });

            const metadata = await Promise.all(analysisPromises);
            setFilesMetadata(metadata);
            onConfigurationChange(metadata);

        } catch (error) {
            console.error('Error in analyzeFiles:', error);
            const fallbackMetadata = files.map(file => ({
                fileName: file.name,
                columns: [`Column 1 (${file.name})`], sampleData: [],
                detectedHeaderRow: 0, totalRows: 0,
                columnMappings: [{
                    columnName: `Column 1 (${file.name})`, isEnabled: false,
                    selectedComorbidities: [], customPrompt: 'Error analyzing file. Please configure manually.',
                    sampleData: []
                }]
            }));
            setFilesMetadata(fallbackMetadata);
            onConfigurationChange(fallbackMetadata);
        } finally {
            setLoading(false);
        }
        // Add dependencies for useCallback
    }, [files, onConfigurationChange]);

    useEffect(() => {
        if (files.length > 0) {
            analyzeFiles();
        }
        // Update the useEffect dependency array
    }, [analyzeFiles]);

    // --- FIX ENDS HERE ---

    const shouldAutoEnableColumn = (columnName: string): boolean => {
        const medicalKeywords = [
            'finding', 'diagnosis', 'symptom', 'condition', 'complication',
            'history', 'medical', 'clinical', 'assessment', 'notes', 'comment'
        ];

        return medicalKeywords.some(keyword =>
            columnName.toLowerCase().includes(keyword)
        );
    };

    const generateDefaultPrompt = (columnName: string): string => {
        const columnLower = columnName.toLowerCase();
        if (columnLower.includes('finding') || columnLower.includes('diagnosis')) {
            return `Analyze this medical finding/diagnosis text for specific comorbidities. Look for exact medical conditions, symptoms, or clinical indicators that match the selected comorbidities.`;
        } else if (columnLower.includes('history')) {
            return `Review this medical history for mentions of the selected comorbidities. Include past medical conditions, family history, or previous diagnoses.`;
        } else if (columnLower.includes('note') || columnLower.includes('comment')) {
            return `Examine this clinical note for any references to the selected comorbidities. Look for direct mentions, related symptoms, or clinical indicators.`;
        } else {
            return `Analyze this medical text for any indicators of the selected comorbidities. Consider both direct mentions and related clinical signs.`;
        }
    };

    const updateColumnMapping = (
        fileIndex: number,
        columnIndex: number,
        updates: Partial<ColumnMapping>
    ) => {
        setFilesMetadata(prev => {
            const updated = [...prev];
            updated[fileIndex].columnMappings[columnIndex] = {
                ...updated[fileIndex].columnMappings[columnIndex],
                ...updates
            };
            onConfigurationChange(updated);
            return updated;
        });
    };

    const toggleComorbidityForColumn = (
        fileIndex: number,
        columnIndex: number,
        comorbidityId: string
    ) => {
        const currentMappings = filesMetadata[fileIndex].columnMappings[columnIndex];
        const selectedComorbidities = currentMappings.selectedComorbidities.includes(comorbidityId)
            ? currentMappings.selectedComorbidities.filter(id => id !== comorbidityId)
            : [...currentMappings.selectedComorbidities, comorbidityId];

        updateColumnMapping(fileIndex, columnIndex, { selectedComorbidities });
    };

    const filteredComorbidities = comorbidities.filter(c =>
        c.enabled && (
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Analyzing file structure...</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Processing {files.length} file{files.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                        This may take a few moments for large files
                    </p>
                </div>
            </div>
        );
    }

    // ... The rest of your return JSX remains exactly the same
    return (
        <div className="space-y-6">
            {/* Search Comorbidities */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search comorbidities to map..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                />
            </div>

            {filesMetadata.map((fileMetadata, fileIndex) => (
                <motion.div
                    key={fileMetadata.fileName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
                >
                    {/* File Header */}
                    <div
                        className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 cursor-pointer"
                        onClick={() => setExpandedFiles(prev => ({
                            ...prev,
                            [fileMetadata.fileName]: !prev[fileMetadata.fileName]
                        }))}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <FileSpreadsheet className="text-blue-500" size={32} />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{fileMetadata.fileName}</h3>
                                    <p className="text-gray-600">
                                        {fileMetadata.totalRows} rows • {fileMetadata.columns.length} columns •
                                        Header detected at row {fileMetadata.detectedHeaderRow + 1}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-medium text-gray-500 bg-white/50 px-3 py-1 rounded-full">
                                    {fileMetadata.columnMappings.filter(c => c.isEnabled).length} active columns
                                </div>
                                {expandedFiles[fileMetadata.fileName] ?
                                    <ChevronUp className="text-gray-400" size={24} /> :
                                    <ChevronDown className="text-gray-400" size={24} />
                                }
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedFiles[fileMetadata.fileName] && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-6 space-y-6">
                                    {/* Sample Data Preview */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Eye className="text-blue-500" size={20} />
                                            Sample Data Preview (First 3 rows)
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        {fileMetadata.columns.map((column, idx) => (
                                                            <th key={idx} className="text-left p-2 font-medium text-gray-700">
                                                                {column}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {fileMetadata.sampleData.slice(0, 3).map((row, rowIdx) => (
                                                        <tr key={rowIdx} className="border-b border-gray-100">
                                                            {fileMetadata.columns.map((column, colIdx) => (
                                                                <td key={colIdx} className="p-2 text-gray-600 max-w-32 truncate">
                                                                    {row[column] || '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Column Configurations */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                                            <Settings className="text-purple-500" size={20} />
                                            Column Mappings & Prompts
                                        </h4>

                                        {fileMetadata.columnMappings.map((mapping, columnIndex) => (
                                            <motion.div
                                                key={mapping.columnName}
                                                className={`border-2 rounded-xl transition-all duration-300 ${mapping.isEnabled
                                                    ? 'border-blue-200 bg-blue-50/30'
                                                    : 'border-gray-200 bg-gray-50/30'
                                                    }`}
                                            >
                                                {/* Column Header */}
                                                <div className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={mapping.isEnabled}
                                                            onChange={(e) => updateColumnMapping(
                                                                fileIndex,
                                                                columnIndex,
                                                                { isEnabled: e.target.checked }
                                                            )}
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <div>
                                                            <h5 className="font-semibold text-gray-900">{mapping.columnName}</h5>
                                                            <p className="text-sm text-gray-600">
                                                                {mapping.selectedComorbidities.length} comorbidities mapped
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setExpandedColumns(prev => ({
                                                            ...prev,
                                                            [`${fileMetadata.fileName}_${mapping.columnName}`]:
                                                                !prev[`${fileMetadata.fileName}_${mapping.columnName}`]
                                                        }))}
                                                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                                    >
                                                        {expandedColumns[`${fileMetadata.fileName}_${mapping.columnName}`] ?
                                                            <ChevronUp size={20} /> : <ChevronDown size={20} />
                                                        }
                                                    </button>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedColumns[`${fileMetadata.fileName}_${mapping.columnName}`] && mapping.isEnabled && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden border-t border-gray-200"
                                                        >
                                                            <div className="p-4 space-y-4">
                                                                {/* Sample Data for this Column */}
                                                                <div className="bg-white rounded-lg p-3">
                                                                    <h6 className="text-sm font-medium text-gray-700 mb-2">Sample Values:</h6>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {mapping.sampleData.slice(0, 5).map((value, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="text-xs bg-gray-100 px-2 py-1 rounded-lg max-w-32 truncate"
                                                                            >
                                                                                {value || 'Empty'}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Comorbidity Selection */}
                                                                <div>
                                                                    <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                                        <Target className="text-blue-500" size={16} />
                                                                        Map Comorbidities to Check
                                                                    </h6>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                                                        {filteredComorbidities.map((comorbidity) => (
                                                                            <label
                                                                                key={comorbidity.id}
                                                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mapping.selectedComorbidities.includes(comorbidity.id)
                                                                                    ? 'border-blue-500 bg-blue-50'
                                                                                    : 'border-gray-200 hover:border-blue-300'
                                                                                    }`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={mapping.selectedComorbidities.includes(comorbidity.id)}
                                                                                    onChange={() => toggleComorbidityForColumn(
                                                                                        fileIndex,
                                                                                        columnIndex,
                                                                                        comorbidity.id
                                                                                    )}
                                                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                                                />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="font-medium text-gray-900 truncate">
                                                                                        {comorbidity.name}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-600 truncate">
                                                                                        {comorbidity.description}
                                                                                    </div>
                                                                                </div>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Custom Prompt */}
                                                                <div>
                                                                    <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                                        <Brain className="text-purple-500" size={16} />
                                                                        AI Analysis Prompt
                                                                    </h6>
                                                                    <textarea
                                                                        value={mapping.customPrompt}
                                                                        onChange={(e) => updateColumnMapping(
                                                                            fileIndex,
                                                                            columnIndex,
                                                                            { customPrompt: e.target.value }
                                                                        )}
                                                                        placeholder="Enter instructions for the AI to analyze this column..."
                                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-200 resize-none"
                                                                        rows={3}
                                                                    />
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        The AI will use this prompt to analyze each cell in this column for the selected comorbidities.
                                                                    </p>
                                                                </div>

                                                                {/* Validation */}
                                                                {mapping.selectedComorbidities.length === 0 && (
                                                                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                        <AlertCircle className="text-yellow-600" size={16} />
                                                                        <span className="text-sm text-yellow-800">
                                                                            Select at least one comorbidity to check in this column
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Configuration Summary */}
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                                        <h5 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                                            <Check className="text-emerald-600" size={20} />
                                            Configuration Summary
                                        </h5>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-emerald-600">Active Columns:</span>
                                                <span className="ml-2 font-medium">
                                                    {fileMetadata.columnMappings.filter(c => c.isEnabled).length}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-emerald-600">Total Mappings:</span>
                                                <span className="ml-2 font-medium">
                                                    {fileMetadata.columnMappings.reduce((sum, c) => sum + c.selectedComorbidities.length, 0)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-emerald-600">Unique Comorbidities:</span>
                                                <span className="ml-2 font-medium">
                                                    {new Set(fileMetadata.columnMappings.flatMap(c => c.selectedComorbidities)).size}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-emerald-600">Ready to Process:</span>
                                                <span className="ml-2 font-medium">
                                                    {fileMetadata.columnMappings.some(c => c.isEnabled && c.selectedComorbidities.length > 0) ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
};