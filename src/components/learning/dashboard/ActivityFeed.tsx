"use client";

import React from 'react';
import { CheckCircle, Zap, Star } from 'lucide-react';

interface ActivityFeedProps {
  events: any[];
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
        No recent activity. Start learning to fill your feed!
      </div>
    );
  }

  const formatEventMessage = (event: any) => {
    switch(event.event_type) {
      case 'LESSON_COMPLETED':
        return `Completed lesson ${event.metadata?.lesson_id || ''}`;
      case 'XP_EARNED':
        return `Earned ${event.metadata?.amount || 0} XP`;
      case 'ASSESSMENT_PASSED':
        return `Passed assessment ${event.metadata?.assessment_id || ''}`;
      default:
        return event.event_type;
    }
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'LESSON_COMPLETED':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'XP_EARNED':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'ASSESSMENT_PASSED':
        return <Star className="w-5 h-5 text-purple-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-zinc-500" />;
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {events.map((event, idx) => (
          <div key={event.id || idx} className="flex items-start gap-4">
            <div className="mt-0.5 bg-zinc-800 rounded-full p-1.5 shrink-0">
              {getEventIcon(event.event_type)}
            </div>
            <div>
              <p className="text-sm text-zinc-200 font-medium">
                {formatEventMessage(event)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {new Date(event.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
