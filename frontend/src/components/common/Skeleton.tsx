import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const SkeletonBase = styled.div`
  background-color: #1f2937;
  border-radius: 4px;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const PostSkeletonContainer = styled.div`
  padding: 16px;
  border-bottom: 1px solid #1f2937;
`;

const FlexRow = styled.div<{ $gap?: number; $mb?: number }>`
  display: flex;
  align-items: center;
  gap: ${props => props.$gap || 8}px;
  margin-bottom: ${props => props.$mb || 0}px;
`;

const FlexBetween = styled.div<{ $mb?: number }>`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: ${props => props.$mb || 0}px;
`;

const SkeletonBox = styled(SkeletonBase)<{ $w?: string; $h?: string; $round?: boolean; $radius?: number }>`
  width: ${props => props.$w || '100%'};
  height: ${props => props.$h || '16px'};
  border-radius: ${props => props.$round ? '50%' : props.$radius ? `${props.$radius}px` : '4px'};
`;

// 범용 Skeleton 컴포넌트
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  round?: boolean;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius, round, style }) => {
  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number' ? `${height}px` : height;
  return <SkeletonBox $w={w} $h={h} $radius={borderRadius} $round={round} style={style} />;
};

const SpaceY = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.$gap || 8}px;
`;

export const PostSkeleton: React.FC = () => (
  <PostSkeletonContainer>
    <FlexRow $gap={8} $mb={8}>
      <SkeletonBox $w="64px" $h="16px" />
      <SkeletonBox $w="40px" $h="12px" />
    </FlexRow>
    <FlexRow $gap={8} $mb={12}>
      <SkeletonBox $w="16px" $h="16px" $round />
      <SkeletonBox $w="80px" $h="12px" />
    </FlexRow>
    <FlexBetween $mb={12}>
      <SpaceY $gap={8} style={{ flex: 1 }}>
        <SkeletonBox $w="75%" $h="20px" />
        <SkeletonBox $w="100%" $h="16px" />
        <SkeletonBox $w="66%" $h="16px" />
      </SpaceY>
      <SkeletonBox $w="96px" $h="96px" style={{ borderRadius: '8px', flexShrink: 0 }} />
    </FlexBetween>
    <FlexRow $gap={16}>
      <SkeletonBox $w="40px" $h="12px" />
      <SkeletonBox $w="40px" $h="12px" />
    </FlexRow>
  </PostSkeletonContainer>
);

const DetailSkeletonContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 80px;
`;

export const DetailSkeleton: React.FC = () => (
  <DetailSkeletonContainer>
    <FlexRow $gap={12} $mb={24}>
      <SkeletonBox $w="40px" $h="40px" $round />
      <SpaceY $gap={8}>
        <SkeletonBox $w="96px" $h="16px" />
        <SkeletonBox $w="64px" $h="12px" />
      </SpaceY>
    </FlexRow>
    <SkeletonBox $w="75%" $h="32px" style={{ marginBottom: '24px' }} />
    <SpaceY $gap={12} style={{ marginBottom: '32px' }}>
      <SkeletonBox $w="100%" $h="16px" />
      <SkeletonBox $w="100%" $h="16px" />
      <SkeletonBox $w="83%" $h="16px" />
      <SkeletonBox $w="100%" $h="16px" />
    </SpaceY>
    <SkeletonBox $w="100%" $h="256px" style={{ borderRadius: '8px', marginBottom: '24px' }} />
    <FlexRow $gap={12}>
      <SkeletonBox $w="64px" $h="32px" />
      <SkeletonBox $w="64px" $h="32px" />
    </FlexRow>
  </DetailSkeletonContainer>
);

export default { Skeleton, PostSkeleton, DetailSkeleton };
