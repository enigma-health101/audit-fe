// components/steps/Step2ConfigureComorbidities.tsx
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface Comorbidity {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    keywords?: string;
}

interface Step2Props {
    comorbidities: Comorbidity[];
    onComorbidityToggle: (id: string) => void;
}

export default function Step2ConfigureComorbidities({ comorbidities, onComorbidityToggle }: Step2Props) {
    if (comorbidities.length === 0) return null;

    return (
        <div className="glass-card p-8 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <span className="text-white font-bold text-xl">2</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Configure Comorbidities</h2>
                    <p className="text-gray-600">Select which comorbidities to analyze</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comorbidities.map((comorbidity, index) => (
                    <motion.div
                        key={comorbidity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 shadow-sm hover:shadow-md
                            ${comorbidity.enabled
                                ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-500/10'
                                : 'border-gray-200 bg-white/50 hover:border-gray-300'
                            }
                        `}
                        onClick={() => onComorbidityToggle(comorbidity.id)}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-all duration-200 shadow-sm
                                ${comorbidity.enabled
                                    ? 'border-emerald-500 bg-emerald-500'
                                    : 'border-gray-300'
                                }
                            `}>
                                {comorbidity.enabled && <Check size={16} className="text-white" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 mb-1">{comorbidity.name}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{comorbidity.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 text-blue-700">
                    <Sparkles size={20} />
                    <span className="font-semibold">
                        {comorbidities.filter(c => c.enabled).length} of {comorbidities.length} comorbidities selected
                    </span>
                </div>
            </div>
        </div>
    );
}