
import React from 'react';
import type { AnalysisResponse, Moderation, Sentiment, ModerationAction } from '../types';
import { Sentiment as SentimentEnum, ModerationAction as ModerationActionEnum } from '../types'; // Named import for enum values

interface AnalysisDisplayProps {
  result: AnalysisResponse;
}

const SentimentIndicator: React.FC<{ sentiment: Sentiment | string }> = ({ sentiment }) => {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-800';

  switch (sentiment) {
    case SentimentEnum.POSITIVE:
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      break;
    case SentimentEnum.NEGATIVE:
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      break;
    case SentimentEnum.NEUTRAL:
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-700';
      break;
    case SentimentEnum.MIXED:
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      break;
  }
  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${bgColor} ${textColor}`}>
      {sentiment}
    </span>
  );
};

const IntensityBar: React.FC<{ intensity: number }> = ({ intensity }) => {
  const percentage = Math.round(intensity * 100);
  let barColor = 'bg-gray-300';
  if (percentage > 75) barColor = 'bg-red-500';
  else if (percentage > 50) barColor = 'bg-yellow-500';
  else if (percentage > 25) barColor = 'bg-blue-500';
  else barColor = 'bg-green-500';


  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div 
        className={`h-2.5 rounded-full ${barColor} transition-all duration-500 ease-out`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const ModerationDisplay: React.FC<{ moderation: Moderation }> = ({ moderation }) => {
  let actionColor = 'text-gray-700';
  let borderColor = 'border-gray-300';

  switch (moderation.action) {
    case ModerationActionEnum.ALLOW:
      actionColor = 'text-green-700';
      borderColor = 'border-green-300';
      break;
    case ModerationActionEnum.BLOCK:
      actionColor = 'text-red-700';
      borderColor = 'border-red-300';
      break;
    case ModerationActionEnum.REQUEST_REPHRASING:
      actionColor = 'text-yellow-700';
      borderColor = 'border-yellow-300';
      break;
  }

  return (
    <div className={`p-4 border-l-4 ${borderColor} bg-gray-50 rounded-md`}>
      <p className="font-semibold">
        Moderation Action: <span className={`${actionColor} font-bold`}>{moderation.action}</span>
      </p>
      <p className="text-sm text-gray-600 mt-1">Reason: {moderation.reason}</p>
    </div>
  );
};


export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  if (!result) return null;

  return (
    <div className="mt-8 p-6 bg-slate-50 rounded-lg shadow-lg space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Feedback Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-500">Overall Sentiment</p>
          <SentimentIndicator sentiment={result.sentiment} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Sentiment Intensity ({Math.round(result.intensity * 100)}%)</p>
          <IntensityBar intensity={result.intensity} />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500">Summary</p>
        <p className="text-gray-700 bg-gray-100 p-3 rounded-md">{result.summary}</p>
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">Moderation Suggestion</p>
        <ModerationDisplay moderation={result.moderation} />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500">Actionable Insight for HR</p>
        <p className="text-gray-700 bg-gray-100 p-3 rounded-md">{result.actionable_insight}</p>
      </div>
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};
