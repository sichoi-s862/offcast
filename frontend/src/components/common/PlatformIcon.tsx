import React from 'react';
import styled from 'styled-components';
import { Briefcase } from 'lucide-react';

import youtubeIcon from '../../assets/youtube_icon.svg';
import tiktokIcon from '../../assets/tiktok_icon.svg';
import chzzkIcon from '../../assets/chzzk_icon.svg'; // Twitter 아이콘 임시 사용

interface PlatformIconProps {
  provider: string;
  size?: number;
  adjustMargin?: boolean;
}

const getMarginLeft = (provider: string): string => {
  switch (provider.toLowerCase()) {
    case 'youtube': return '-5px';
    case 'tiktok': return '-6px';
    case 'twitter': return '-6px';
    default: return '0px';
  }
};

const IconWrapper = styled.span<{ $size: number; $provider: string; $adjustMargin: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  flex-shrink: 0;
  border-radius: 50%;
  margin-left: ${props => props.$adjustMargin ? getMarginLeft(props.$provider) : '0px'};
`;

const IconImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const FallbackWrapper = styled.span<{ $size: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;

  svg {
    width: ${props => props.$size}px;
    height: ${props => props.$size}px;
  }
`;

const getIconByProvider = (provider: string): string | null => {
  switch (provider.toLowerCase()) {
    case 'youtube': return youtubeIcon;
    case 'tiktok': return tiktokIcon;
    case 'twitter': return chzzkIcon; // Twitter 아이콘 임시 사용 (나중에 교체 예정)
    default: return null;
  }
};

export const PlatformIcon: React.FC<PlatformIconProps> = ({ provider, size = 24, adjustMargin = false }) => {
  const iconSrc = getIconByProvider(provider);

  if (!iconSrc) {
    return (
      <FallbackWrapper $size={size}>
        <Briefcase />
      </FallbackWrapper>
    );
  }

  return (
    <IconWrapper $size={size} $provider={provider} $adjustMargin={adjustMargin}>
      <IconImage src={iconSrc} alt={provider} />
    </IconWrapper>
  );
};

export default PlatformIcon;
