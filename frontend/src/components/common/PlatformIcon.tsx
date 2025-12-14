import React from 'react';
import styled from 'styled-components';
import { Briefcase } from 'lucide-react';

import youtubeIcon from '../../assets/youtube_icon.svg';
import instagramIcon from '../../assets/insta_icon.svg';
import tiktokIcon from '../../assets/tiktok_icon.svg';
import chzzkIcon from '../../assets/chzzk_icon.svg';
import soopIcon from '../../assets/soop_icon.svg';

interface PlatformIconProps {
  provider: string;
  size?: number;
  adjustMargin?: boolean;
}

const getMarginLeft = (provider: string): string => {
  switch (provider.toLowerCase()) {
    case 'youtube': return '-5px';
    case 'instagram': return '-6px';
    case 'tiktok': return '-6px';
    case 'chzzk': return '-6px';
    case 'soop': return '-2px';
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
    case 'instagram': return instagramIcon;
    case 'tiktok': return tiktokIcon;
    case 'chzzk': return chzzkIcon;
    case 'soop': return soopIcon;
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
