import React from 'react';
import styled from 'styled-components';
import { ChevronLeft } from 'lucide-react';

interface SubPageHeaderProps {
  title: string;
  onBack: () => void;
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #1f2937;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
`;

const BackButton = styled.button`
  padding: 10px;
  margin-left: -10px;
  min-width: 44px;
  min-height: 44px;
  color: white;
  border-radius: 8px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #1f2937;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: white;
`;

export const SubPageHeader: React.FC<SubPageHeaderProps> = ({ title, onBack }) => (
  <Header>
    <BackButton onClick={onBack} aria-label="Go back">
      <ChevronLeft />
    </BackButton>
    <Title>{title}</Title>
  </Header>
);

export default SubPageHeader;
