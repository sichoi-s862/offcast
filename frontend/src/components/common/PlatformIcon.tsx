import React from 'react';
import styled from 'styled-components';
import { Youtube, Instagram, Briefcase } from 'lucide-react';
import { TikTokIcon, ChzzkIcon, SoopIcon } from '../icons/PlatformIcons';

interface PlatformIconProps {
  provider: string;
  size?: number;
}

const IconWrapper = styled.span<{ $color: string; $size: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$color};

  svg {
    width: ${props => props.$size}px;
    height: ${props => props.$size}px;
  }
`;

const getColorByProvider = (provider: string): string => {
  switch (provider.toLowerCase()) {
    case 'youtube': return '#ef4444';
    case 'instagram': return '#ec4899';
    case 'tiktok': return '#22d3ee';
    case 'chzzk': return '#00FFA3';
    case 'soop': return '#3b82f6';
    default: return '#9ca3af';
  }
};

export const PlatformIcon: React.FC<PlatformIconProps> = ({ provider, size = 24 }) => {
  const color = getColorByProvider(provider);

  const renderIcon = () => {
    switch (provider.toLowerCase()) {
      case 'youtube':
        return <Youtube />;
      case 'instagram':
        return <Instagram />;
      case 'tiktok':
        return <TikTokIcon size={size} />;
      case 'chzzk':
        return <ChzzkIcon size={size} />;
      case 'soop':
        return <SoopIcon size={size} />;
      default:
        return <Briefcase />;
    }
  };

  return (
    <IconWrapper $color={color} $size={size}>
      {renderIcon()}
    </IconWrapper>
  );
};

export default PlatformIcon;
