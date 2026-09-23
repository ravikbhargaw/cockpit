'use client';

import React, { useState, useEffect } from 'react';
import { GreetingBanner } from '@/components/dashboard/GreetingBanner';
import { PartnerMomentum } from '@/components/dashboard/PartnerMomentum';
import { TodayPriorities } from '@/components/dashboard/TodayPriorities';
import { PipelineSnapshot } from '@/components/dashboard/PipelineSnapshot';
import { RelationshipAttention } from '@/components/dashboard/RelationshipAttention';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default function TodayDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      console.error('Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Greeting Banner */}
      <GreetingBanner />

      {/* 2. Top Row: Partner Momentum & Today's Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PartnerMomentum
            activeCount={data?.partnerMomentum?.activeCount}
            targetCount={data?.partnerMomentum?.targetCount}
            headline={data?.partnerMomentum?.headline}
            subtext={data?.partnerMomentum?.subtext}
          />
        </div>
        <div className="lg:col-span-2">
          <TodayPriorities priorities={data?.priorities || []} />
        </div>
      </div>

      {/* 3. Pipeline Snapshot KPIs */}
      <PipelineSnapshot kpis={data?.kpis || {}} />

      {/* 4. Bottom Row: Relationship Attention & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RelationshipAttention attention={data?.attention || []} />
        <QuickActions onSuccess={fetchDashboardData} />
      </div>
    </div>
  );
}
