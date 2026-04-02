'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { UploadCloud, AlertCircle, Loader2, Image as ImageIcon, Activity, Smile, Brain, Eye, Fingerprint, Database, History, Heart, ShieldAlert } from 'lucide-react';
import Image from 'next/image';

// Initialize Gemini API
const getAI = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.');
  }
  return new GoogleGenAI({ apiKey });
};

interface AnalysisResult {
  id?: string;
  timestamp?: number;
  micro_observations: {
    eyes: string;
    brows: string;
    mouth: string;
    jaw: string;
    symmetry: string;
    posture: string;
  };
  pattern_analysis: string;
  surface_presentation: string;
  underlying_emotional_signals: {
    signal: string;
    confidence: string;
    reasoning: string;
  }[];
  deeper_pattern_hypothesis: string;
  uncertainty_note: string;
  wellbeing_suggestions: string[];
}

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('deepmap_learning_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem('deepmap_learning_history', JSON.stringify(history));
  }, [history]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = getAI();
      // Convert file to base64
      const buffer = await imageFile.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');

      const historyContext = history.length > 0 
        ? `\n\n--- CONTINUOUS LEARNING CONTEXT ---\nYou have previously analyzed ${history.length} subjects. Past insights: ${JSON.stringify(history.map(h => ({ surface: h.surface_presentation, hypothesis: h.deeper_pattern_hypothesis })))}\nUse this accumulated knowledge to refine your current analysis. If the subject appears to be the same person as before, analyze their psychological trajectory.` 
        : '';

      const promptText = `You are an advanced emotional pattern analysis AI.

Your task is to perform a layered interpretation of visible facial and postural cues to infer possible underlying emotional patterns. This is NOT a medical or psychological diagnosis, and you must not claim to access the subconscious mind directly.

Instead, simulate a "deep mapping" by analyzing subtle visual signals and forming multi-layered interpretations.

Follow this structured approach:

Step 1: Micro-Observation Layer
Carefully analyze:
- Eye region (tension, openness, gaze stability)
- Eyebrows (compression, lift, asymmetry)
- Mouth (tightness, curvature, micro-tension)
- Jaw (clenching, rigidity)
- Facial symmetry (imbalances, uneven activation)
- Posture (if visible: openness vs contraction)

Step 2: Pattern Synthesis
Combine observed cues into meaningful patterns. Avoid isolated conclusions. Look for:
- Congruence vs mismatch (e.g., smiling mouth but tense eyes)
- Signs of suppression, fatigue, or cognitive load
- Subtle asymmetries that may indicate uneven emotional expression

Step 3: Layered Interpretation
Generate 3 layers of insight:

1. Surface Presentation  
   - What the person appears to express outwardly

2. Underlying Emotional Signals  
   - Possible internal emotional states (use probabilistic language only)

3. Deeper Pattern Hypothesis  
   - A nuanced interpretation of what these combined signals *may* suggest about internal tension, emotional masking, or mental load

Step 4: Confidence & Uncertainty
- Assign confidence levels (low / medium / high)
- Explicitly state limitations of visual-only inference

Step 5: Supportive Guidance
- Provide 2–3 gentle, non-clinical suggestions for wellbeing
- Keep tone calm, neutral, and supportive

Strict Rules:
- Do NOT diagnose depression, anxiety, or any mental disorder
- Do NOT claim to reveal subconscious truth
- Use cautious language: "may indicate", "could suggest", "possible sign"
- Avoid deterministic or absolute statements
- Do not exaggerate certainty

Tone:
Analytical, calm, perceptive, and non-judgmental.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              data: base64Image,
              mimeType: imageFile.type,
            },
          },
          {
            text: promptText + historyContext,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              micro_observations: {
                type: Type.OBJECT,
                properties: {
                  eyes: { type: Type.STRING },
                  brows: { type: Type.STRING },
                  mouth: { type: Type.STRING },
                  jaw: { type: Type.STRING },
                  symmetry: { type: Type.STRING },
                  posture: { type: Type.STRING },
                },
                required: ['eyes', 'brows', 'mouth', 'jaw', 'symmetry', 'posture']
              },
              pattern_analysis: { type: Type.STRING },
              surface_presentation: { type: Type.STRING },
              underlying_emotional_signals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    signal: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                    reasoning: { type: Type.STRING }
                  },
                  required: ['signal', 'confidence', 'reasoning']
                }
              },
              deeper_pattern_hypothesis: { type: Type.STRING },
              uncertainty_note: { type: Type.STRING },
              wellbeing_suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['micro_observations', 'pattern_analysis', 'surface_presentation', 'underlying_emotional_signals', 'deeper_pattern_hypothesis', 'uncertainty_note', 'wellbeing_suggestions'],
          },
        },
      });

      if (response.text) {
        const parsedResult = JSON.parse(response.text) as AnalysisResult;
        parsedResult.id = Math.random().toString(36).substring(7);
        parsedResult.timestamp = Date.now();
        setResult(parsedResult);
        setHistory(prev => [parsedResult, ...prev]);
      } else {
        throw new Error('No response from the model.');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStressColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
              <Fingerprint className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Deep<span className="text-indigo-400">Map</span></h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">API Key Missing</p>
              <p className="text-sm">
                The Gemini API key is not configured. If you are running this on Vercel, please add 
                <code className="mx-1 px-1 bg-amber-100 rounded">NEXT_PUBLIC_GEMINI_API_KEY</code> 
                to your environment variables in the Vercel dashboard.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Subconscious Psychological Mapping
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload a photo to perform an experimental deep-layer analysis of micro-expressions, ocular tension, and underlying emotional resonance. The AI learns from each analysis to improve its accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-slate-400" />
              Photo Input
            </h3>
            
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ease-in-out
                ${imagePreview ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
                ${isAnalyzing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
              `}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="relative w-full aspect-square max-h-[400px] rounded-lg overflow-hidden shadow-sm">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-medium flex items-center gap-2">
                      <UploadCloud className="w-5 h-5" /> Change Photo
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="bg-indigo-50 p-4 rounded-full mb-4 text-indigo-500">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <p className="text-slate-700 font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-slate-500 text-sm">SVG, PNG, JPG or GIF (max. 5MB)</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 text-sm border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={analyzeImage}
              disabled={!imageFile || isAnalyzing}
              className={`mt-6 w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 flex items-center justify-center gap-2
                ${!imageFile || isAnalyzing 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow active:scale-[0.98]'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Photo...
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  Initiate Deep Mapping
                </>
              )}
            </button>

            {/* Learning Memory Section */}
            {history.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-8 animate-in fade-in duration-500">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Neural Learning Database ({history.length} profiles)
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((item, idx) => (
                    <div key={item.id || idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-700">Subject #{history.length - idx}</span>
                      </div>
                      <p className="text-slate-500 text-xs truncate">State: {item.surface_presentation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="flex flex-col gap-6">
            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm leading-relaxed shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong className="block font-semibold text-amber-900 mb-1">Experimental AI Analysis</strong>
                  This application uses artificial intelligence to estimate emotional states based on visual cues. 
                  It is <strong>not a medical diagnostic tool</strong> and should not be used for medical, psychological, or psychiatric evaluation. 
                  If you are experiencing significant stress or depression, please consult a qualified healthcare professional.
                </div>
              </div>
            </div>

            {/* Results Card */}
            {result ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <Fingerprint className="w-5 h-5 text-indigo-500" />
                  Emotional Pattern Analysis
                </h3>
                
                <div className="space-y-8">
                  
                  {/* Layer 1: Surface & Micro */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-500" />
                      Micro-Observations & Surface Presentation
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-3">
                      <p className="text-sm text-slate-700 font-medium mb-1">Surface Presentation:</p>
                      <p className="text-sm text-slate-600">{result.surface_presentation}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(result.micro_observations).map(([key, value]) => (
                        <div key={key} className="bg-white border border-slate-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{key}</p>
                          <p className="text-xs text-slate-700">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Layer 2: Pattern Synthesis & Signals */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      Pattern Synthesis & Emotional Signals
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                      <p className="text-sm text-slate-600 leading-relaxed">{result.pattern_analysis}</p>
                    </div>
                    
                    <div className="space-y-3">
                      {result.underlying_emotional_signals.map((signal, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm text-slate-800">{signal.signal}</span>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getStressColor(signal.confidence)}`}>
                              {signal.confidence} Confidence
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{signal.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Layer 3: Deeper Hypothesis */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-indigo-500" />
                      Deeper Pattern Hypothesis
                    </h4>
                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                      <p className="text-sm text-slate-700 leading-relaxed">{result.deeper_pattern_hypothesis}</p>
                    </div>
                  </div>

                  {/* Wellbeing & Uncertainty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        Supportive Guidance
                      </h4>
                      <ul className="space-y-2">
                        {result.wellbeing_suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="text-rose-400 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        Uncertainty Note
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-100">
                        {result.uncertainty_note}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="bg-slate-50 p-4 rounded-full mb-4 text-slate-300">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <h3 className="text-slate-700 font-medium mb-2">Awaiting Subject Data</h3>
                <p className="text-slate-500 text-sm max-w-xs">
                  Upload a photo and initiate mapping to reveal underlying psychological states and micro-expressions.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
