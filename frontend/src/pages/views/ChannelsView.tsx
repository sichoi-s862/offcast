import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Tv, Monitor, Mic2, Lock } from 'lucide-react';
import type { CurrentUser } from '../../types';
import { CHANNELS } from '../../constants';

interface ChannelsViewProps {
  currentUser: CurrentUser;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Container = styled.div`
  padding: 16px;
  padding-bottom: 80px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ChannelCard = styled.div`
  height: 96px;
  background-color: #111827;
  border-radius: 8px;
  border: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    background-color: #1f2937;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const LockOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  svg {
    width: 24px;
    height: 24px;
    color: #9ca3af;
  }
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

export const ChannelsView: React.FC<ChannelsViewProps> = ({ currentUser }) => {
  const getIcon = (channelId: string) => {
    switch (channelId) {
      case 'gear':
        return <Monitor />;
      case 'collab':
        return <Mic2 />;
      default:
        return <Tv />;
    }
  };

  return (
    <Container>
      {CHANNELS.map((c) => {
        const isLocked = currentUser.rawSubCount < c.minSubs;
        return (
          <ChannelCard key={c.id}>
            {isLocked && (
              <LockOverlay>
                <Lock />
              </LockOverlay>
            )}
            <ChannelIcon $locked={isLocked}>
              {getIcon(c.id)}
            </ChannelIcon>
            <ChannelName $locked={isLocked}>{c.name}</ChannelName>
          </ChannelCard>
        );
      })}
    </Container>
  );
};

export default ChannelsView;
