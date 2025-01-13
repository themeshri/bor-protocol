import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../utils/constants';

interface Gift {
  recipientAgentId: string;
  senderPublicKey: string;
  giftName: string;
  giftCount: number;
  coinsTotal: number;
  createdAt: Date;
}

interface PaginatedGiftsResponse {
  gifts: Gift[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalGifts: number;
    hasMore: boolean;
  };
}

interface TopGifter {
  _id: string;
  totalGifts: number;
  totalCoins: number;
  giftsSent: {
    giftName: string;
    count: number;
    coins: number;
    timestamp: Date;
  }[];
}

interface TopGiftersResponse {
  timeframe: string;
  topGifters: TopGifter[];
}

export const useAgentGifts = (agentId: string, page: number = 1, limit: number = 10) => {
  return useQuery<PaginatedGiftsResponse>({
    queryKey: ['agentGifts', agentId, page, limit],
    queryFn: async () => {
      const data  = null;
      return data;
    }
  });
};

export const useTopGifters = (
  agentId: string,
  limit: number = 10,
  timeframe: 'day' | 'week' | 'month' | 'all' = 'all'
) => {
  return useQuery<TopGiftersResponse>({
    queryKey: ['topGifters', agentId, limit, timeframe],
    queryFn: async () => {
      const data = null;
      return data;
    }
  });
};
