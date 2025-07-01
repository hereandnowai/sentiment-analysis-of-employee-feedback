
import React, { useState, useCallback } from 'react';
import { FeedbackInput } from './components/FeedbackInput';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { analyzeFeedback } from './services/geminiService';
import type { AnalysisResponse } from './types';

const App: React.FC = () => {
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!transcribedText.trim()) {
      setError('Please record or provide some feedback to analyze.');
      setAnalysisResult(null);
      return;
    }

    setIsLoadingAnalysis(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeFeedback(transcribedText);
      setAnalysisResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Analysis failed: ${err.message}. Please ensure your API key is correctly configured and check your network connection.`);
      } else {
        setError('An unknown error occurred during analysis.');
      }
      console.error("Analysis error:", err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [transcribedText]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <header className="mb-10 text-center flex flex-col items-center">
        <img
          src="https://raw.githubusercontent.com/hereandnowai/images/main/logos/HNAI%20Title%20-Teal%20%26%20Golden%20Logo%20-%20DESIGN%203%20-%20Raj-07.png"
          alt="HNAI Logo"
          className="h-20 mb-4"
        />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
          Employee Feedback Analyzer
        </h1>
        <p className="mt-3 text-lg text-slate-300 max-w-2xl mx-auto">
          Leverage AI to understand employee sentiment, identify key themes, and derive actionable insights from feedback.
        </p>
      </header>

      <main className="w-full max-w-3xl bg-white shadow-2xl rounded-xl p-6 md:p-10 space-y-8">
        <FeedbackInput
          transcribedText={transcribedText}
          onTranscribedTextChange={setTranscribedText}
          onAnalyze={handleAnalyze}
          isAnalyzing={isLoadingAnalysis}
          setGlobalError={setError}
        />

        {error && (
          <div
            className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {analysisResult && !error && (
          <AnalysisDisplay result={analysisResult} />
        )}
      </main>

      <footer className="mt-12 text-center text-slate-400 text-sm">
        <p>@Crafted by Ananthi – AI Intern at Here and Now AI (2025)</p>
      </footer>
    </div>
  );
};

export default App;
