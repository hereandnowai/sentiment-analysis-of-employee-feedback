
import React, { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../services/geminiService';

interface FeedbackInputProps {
  transcribedText: string;
  onTranscribedTextChange: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  setGlobalError: (error: string | null) => void;
}

export const FeedbackInput: React.FC<FeedbackInputProps> = ({
  transcribedText,
  onTranscribedTextChange,
  onAnalyze,
  isAnalyzing,
  setGlobalError,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [showTranscribedAudioDisplay, setShowTranscribedAudioDisplay] = useState<boolean>(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const clearErrors = useCallback(() => {
    setTranscriptionError(null);
    setGlobalError(null);
  }, [setGlobalError]);

  const handleStartRecording = async () => {
    clearErrors();
    onTranscribedTextChange(''); // Clear previous transcription/typed text
    setShowTranscribedAudioDisplay(false); // Hide transcribed audio display area

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsTranscribing(true);
          setTranscriptionError(null); 
          setShowTranscribedAudioDisplay(false); // Keep it hidden until success
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          try {
            const text = await transcribeAudio(audioBlob);
            onTranscribedTextChange(text);
            if (text) { // Only show if transcription returned text
              setShowTranscribedAudioDisplay(true);
            }
          } catch (error) {
            console.error("Transcription error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during transcription.";
            setTranscriptionError(`Transcription failed: ${errorMessage}`);
            setGlobalError(`Transcription failed: ${errorMessage}`);
            setShowTranscribedAudioDisplay(false);
          } finally {
            setIsTranscribing(false);
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        const errorMsg = err instanceof Error && err.name === 'NotAllowedError' ? 
          "Microphone access denied. Please allow microphone access in your browser settings." :
          "Could not access microphone. Please ensure it is connected and enabled.";
        setTranscriptionError(errorMsg);
        setGlobalError(errorMsg);
        setShowTranscribedAudioDisplay(false);
      }
    } else {
      const errorMsg = "Audio recording is not supported by your browser.";
      setTranscriptionError(errorMsg);
      setGlobalError(errorMsg);
      setShowTranscribedAudioDisplay(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // setIsTranscribing will be set in onstop
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTranscribedTextChange(event.target.value);
    setShowTranscribedAudioDisplay(false); // Hide transcribed audio display when user types
    if (transcriptionError) { 
      clearErrors();
    }
  };
  
  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
         mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);


  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Record Employee Feedback
        </label>
        <div className="flex space-x-3 mb-4">
          {!isRecording ? (
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={isRecording || isTranscribing || isAnalyzing}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              aria-label="Start recording feedback"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z"></path><path fillRule="evenodd" d="M5.5 8.5A2.5 2.5 0 003 11v1a1 1 0 001 1h12a1 1 0 001-1v-1a2.5 2.5 0 00-2.5-2.5V4a5 5 0 00-10 0v4.5z" clipRule="evenodd"></path></svg>
              Record Audio
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopRecording}
              disabled={!isRecording || isTranscribing || isAnalyzing}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              aria-label="Stop recording feedback"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5a1 1 0 011-1h0a1 1 0 011 1v2a1 1 0 01-2 0V5zm2 7a1 1 0 10-2 0v2a1 1 0 102 0v-2z" clipRule="evenodd"></path></svg>
              Stop Recording
            </button>
          )}
        </div>
        
        {(isRecording || isTranscribing) && (
            <div className="text-sm text-gray-600 flex items-center justify-center p-2 bg-yellow-50 rounded-md">
                {isRecording && (
                    <>
                        <svg className="animate-pulse h-4 w-4 text-red-500 mr-2" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>
                        Recording audio...
                    </>
                )}
                {isTranscribing && (
                     <>
                        <svg className="animate-spin h-4 w-4 text-primary-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Transcribing audio... Please wait.
                    </>
                )}
            </div>
        )}

        {transcriptionError && (
          <div className="mt-2 text-sm text-red-600 p-3 bg-red-50 rounded-md" role="alert">
            <p className="font-semibold">Recording/Transcription Error:</p>
            <p>{transcriptionError}</p>
          </div>
        )}
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm font-medium text-gray-500">OR</span>
        </div>
      </div>

      <div>
        <label htmlFor="manualFeedbackText" className="block text-sm font-medium text-gray-700 mb-1">
          Enter the feedback:
        </label>
        <textarea
          id="manualFeedbackText"
          rows={4}
          className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out disabled:opacity-70 disabled:bg-gray-100"
          placeholder="Enter employee feedback here, or record audio above..."
          value={transcribedText}
          onChange={handleTextChange}
          disabled={isRecording || isTranscribing || isAnalyzing}
          aria-label="Type your feedback"
        />
      </div>
      
      {showTranscribedAudioDisplay && transcribedText && (
        <div className="mt-6">
          <label htmlFor="transcribedTextDisplay" className="block text-sm font-medium text-gray-700 mb-1">
            Transcribed Audio:
          </label>
          <div
            id="transcribedTextDisplay"
            aria-live="polite"
            className="block w-full p-3 min-h-[100px] border border-gray-300 rounded-lg bg-gray-50 shadow-sm sm:text-sm whitespace-pre-wrap"
          >
            {transcribedText}
          </div>
        </div>
      )}


      <button
        type="button"
        onClick={onAnalyze}
        disabled={isAnalyzing || isRecording || isTranscribing || !transcribedText.trim()}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-blue-500 hover:from-primary-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        aria-label="Analyze feedback"
      >
        {isAnalyzing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </>
        ) : (
          'Analyze Feedback'
        )}
      </button>
    </div>
  );
};
