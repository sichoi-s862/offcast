import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Tv, Monitor, Mic2, Lock, RefreshCw } from 'lucide-react';
import type { CurrentUser } from '../../types';
import { useChannelStore } from '../../stores';
import { Skeleton } from '../../components/common/Skeleton';

interface ChannelsViewProps {
  currentUser: CurrentUser;
  onChannelSelect?: (channelId: string) => void;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  padding: 16px;
  padding-bottom: 80px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ChannelCard = styled.div<{ $locked?: boolean }>`
  height: 96px;
  background-color: #111827;
  border-radius: 8px;
  border: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: ${props => props.$locked ? 'not-allowed' : 'pointer'};
  position: relative;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$locked ? '#111827' : '#1f2937'};
  }

  &:active {
    transform: ${props => props.$locked ? 'none' : 'scale(0.95)'};
  }
`;

const LockOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  z-index: 10;

  svg {
    width: 24px;
    height: 24px;
    color: #9ca3af;
  }
`;

const LockText = styled.span`
  font-size: 10px;
  color: #6b7280;
`;

const ChannelIcon = styled.div<{ $locked: boolean }>`
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$locked ? '#4b5563' : '#9ca3af'};
  }
`;

const ChannelName = styled.span<{ $locked: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${props => props.$locked ? '#4b5563' : '#e5e7eb'};
`;

const PostCount = styled.span`
  font-size: 11px;
  color: #6b7280;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
  grid-column: span 2;
`;

const ErrorText = styled.p`
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
`;

const RetryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #374151;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4b5563;
  }

  svg {
    width: 16px;
    height: 16px;
  }

  &.loading svg {
    animation: ${spin} 1s linear infinite;
  }
`;

const SkeletonCard = styled(ChannelCard)`
  cursor: default;
  &:hover {
    background-color: #111827;
  }
`;

// 채널 ID별 아이콘 매핑
const getIcon = (channelId: string, slug?: string) => {
  const identifier = slug || channelId;
  if (identifier.includes('gear') || identifier.includes('setting')) {
    return <Monitor />;
  }
  if (identifier.includes('collab') || identifier.includes('guest')) {
    return <Mic2 />;
  }
  return <Tv />;
};

// 구독자 수 포맷 (구간 표시)
const formatSubsRange = (minSubs: number, maxSubs: number | null): string => {
  const formatNum = (n: number): string => {
    if (n >= 1000000) return `${n / 10000}만`;
    if (n >= 10000) return `${n / 10000}만`;
    if (n >= 1000) return `${n / 1000}천`;
    return n.toString();
  };

  if (minSubs === 0) return '';
  if (maxSubs === null) return `${formatNum(minSubs)}+`;
  return `${formatNum(minSubs)}~${formatNum(maxSubs)}`;
};

export const ChannelsView: React.FC<ChannelsViewProps> = ({ currentUser, onChannelSelect }) => {
  const { channels, isLoading, error, fetchChannels } = useChannelStore();

  // 채널 클릭 핸들러
  const handleChannelClick = (channelId: string, isLocked: boolean) => {
    if (isLocked) {
      return;
    }
    onChannelSelect?.(channelId);
  };

  // 로딩 상태
  if (isLoading && channels.length === 0) {
    return (
      <Container>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i}>
            <Skeleton width={24} height={24} borderRadius={4} />
            <Skeleton width={60} height={14} borderRadius={4} />
          </SkeletonCard>
        ))}
      </Container>
    );
  }

  // 에러 상태
  if (error && channels.length === 0) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <RetryButton onClick={() => fetchChannels()} className={isLoading ? 'loading' : ''}>
            <RefreshCw />
            다시 시도
          </RetryButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      {channels.map((channel) => {
        // min/max 범위 체크
        const belowMin = currentUser.rawSubCount < channel.minSubscribers;
        const aboveMax = channel.maxSubscribers !== null && currentUser.rawSubCount > channel.maxSubscribers;
        const isLocked = belowMin || aboveMax;
        const rangeText = formatSubsRange(channel.minSubscribers, channel.maxSubscribers);

        return (
          <ChannelCard
            key={channel.id}
            $locked={isLocked}
            onClick={() => handleChannelClick(channel.id, isLocked)}
          >
            {isLocked && (
              <LockOverlay>
                <Lock />
                {rangeText && <LockText>{rangeText}</LockText>}
              </LockOverlay>
            )}
            <ChannelIcon $locked={isLocked}>
              {getIcon(channel.id, channel.slug)}
            </ChannelIcon>
            <ChannelName $locked={isLocked}>{channel.name}</ChannelName>
            {channel._count?.posts !== undefined && !isLocked && (
              <PostCount>게시글 {channel._count.posts}개</PostCount>
            )}
          </ChannelCard>
        );
      })}
    </Container>
  );
};

export default ChannelsView;
