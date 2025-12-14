import React from 'react';
import styled from 'styled-components';
import { Home, MessageSquare, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 768px;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid #1f2937;
`;

const NavInner = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom);
`;

const NavButton = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 16px;
  color: ${props => props.$active ? '#7c3aed' : '#6b7280'};
  transition: color 0.2s;

  &:hover {
    color: ${props => props.$active ? '#7c3aed' : '#9ca3af'};
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const NavLabel = styled.span`
  font-size: 10px;
  font-weight: 500;
`;

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <NavContainer>
      <NavInner>
        <NavButton $active={activeTab === 'home'} onClick={() => onTabChange('home')}>
          <Home />
          <NavLabel>홈</NavLabel>
        </NavButton>
        <NavButton $active={activeTab === 'topics'} onClick={() => onTabChange('topics')}>
          <MessageSquare />
          <NavLabel>채널</NavLabel>
        </NavButton>
        <NavButton $active={activeTab === 'my'} onClick={() => onTabChange('my')}>
          <User />
          <NavLabel>MY</NavLabel>
        </NavButton>
      </NavInner>
    </NavContainer>
  );
};

export default BottomNav;
