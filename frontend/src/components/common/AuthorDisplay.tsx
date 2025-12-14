import React from 'react';
import styled from 'styled-components';
import { Users } from 'lucide-react';
import { PlatformIcon } from './PlatformIcon';

interface AuthorDisplayProps {
  infoString: string;
  className?: string;
  iconSize?: number;
  time?: string;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Nickname = styled.span`
  color: #9ca3af;
  font-weight: 400;
  font-size: 14px;
`;

const Dot = styled.span`
  width: 2px;
  height: 2px;
  background-color: #6b7280;
  border-radius: 50%;
  margin: 0 2px;
`;

const SubscriberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #9ca3af;
  font-size: 14px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const TimeText = styled.span`
  color: #6b7280;
  font-size: 14px;
`;

export const AuthorDisplay: React.FC<AuthorDisplayProps> = ({
  infoString,
  className,
  iconSize = 16,
  time
}) => {
  if (!infoString) return null;

  const [provider, nickname, count] = infoString.split('|');

  return (
    <Container className={className}>
      <PlatformIcon provider={provider} size={iconSize} />
      <Nickname>{nickname}</Nickname>
      <Dot />
      <SubscriberInfo>
        <Users />
        <span>{count}</span>
      </SubscriberInfo>
      {time && (
        <>
          <Dot />
          <TimeText>{time}</TimeText>
        </>
      )}
    </Container>
  );
};

export default AuthorDisplay;
