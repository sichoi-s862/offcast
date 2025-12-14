import React from 'react';
import styled from 'styled-components';

interface IconProps {
  className?: string;
  size?: number;
}

const SvgIcon = styled.svg<{ $size: number }>`
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
`;

export const TikTokIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <SvgIcon viewBox="0 0 24 24" fill="currentColor" className={className} $size={size}>
    <path d="M12.525.025a.5.5 0 0 1 .5.5c0 2.484 2.016 4.5 4.5 4.5a.5.5 0 0 1 .5.5v4.06a.5.5 0 0 1-.5.5 4.977 4.977 0 0 0-2.492-.668h-.508v9.583C14.525 21.282 12.443 23.5 9.875 23.5c-2.568 0-4.65-2.218-4.65-4.958 0-2.74 2.082-4.959 4.65-4.959.39 0 .769.051 1.13.148a.5.5 0 0 1 .386.485v4.045a.5.5 0 0 1-.61.488 2.07 2.07 0 0 0-.906-.208c-1.12 0-2.025.966-2.025 2.158 0 1.193.905 2.159 2.025 2.159 1.12 0 2.025-.966 2.025-2.159V4.525a.5.5 0 0 1 .5-.5h4.125c-.015-1.32.486-2.548 1.334-3.5a.5.5 0 0 1 .386-.18h-.12l-5.615-.32z"/>
  </SvgIcon>
);

export const ChzzkIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <SvgIcon viewBox="0 0 24 24" fill="currentColor" className={className} $size={size}>
    <path d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3.5 5v10h3V12h3v5h3V7h-3v5h-3V7h-3z"/>
  </SvgIcon>
);

export const SoopIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <SvgIcon viewBox="0 0 24 24" fill="currentColor" className={className} $size={size}>
    <circle cx="7" cy="12" r="3.5" />
    <circle cx="17" cy="12" r="3.5" />
    <path d="M7 12h10" stroke="currentColor" strokeWidth="2" />
  </SvgIcon>
);

export const OffcastLogo: React.FC<IconProps> = ({ className, size = 24 }) => (
  <SvgIcon viewBox="0 0 24 24" fill="currentColor" className={className} $size={size}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C7.58172 2 4 5.58172 4 10V19C4 20.6569 5.34315 22 7 22H17C18.6569 22 20 20.6569 20 19V10C20 5.58172 16.4183 2 12 2ZM9 12C9.82843 12 10.5 11.3284 10.5 10.5C10.5 9.67157 9.82843 9 9 9C8.17157 9 7.5 9.67157 7.5 10.5C7.5 11.3284 8.17157 12 9 12ZM15 12C15.8284 12 16.5 11.3284 16.5 10.5C16.5 9.67157 15.8284 9 15 9C14.1716 9 13.5 9.67157 13.5 10.5C13.5 11.3284 14.1716 12 15 12Z" />
  </SvgIcon>
);

// YouTube icon wrapper
export const YouTubeIconWrapper = styled.div<{ $size?: number }>`
  width: ${props => props.$size || 24}px;
  height: ${props => props.$size || 24}px;
  color: #ef4444;
`;

// Instagram icon wrapper
export const InstagramIconWrapper = styled.div<{ $size?: number }>`
  width: ${props => props.$size || 24}px;
  height: ${props => props.$size || 24}px;
  color: #ec4899;
`;

// TikTok icon wrapper
export const TikTokIconWrapper = styled.div<{ $size?: number }>`
  width: ${props => props.$size || 24}px;
  height: ${props => props.$size || 24}px;
  color: #22d3ee;
`;

// Chzzk icon wrapper
export const ChzzkIconWrapper = styled.div<{ $size?: number }>`
  width: ${props => props.$size || 24}px;
  height: ${props => props.$size || 24}px;
  color: #00FFA3;
`;

// SOOP icon wrapper
export const SoopIconWrapper = styled.div<{ $size?: number }>`
  width: ${props => props.$size || 24}px;
  height: ${props => props.$size || 24}px;
  color: #3b82f6;
`;
