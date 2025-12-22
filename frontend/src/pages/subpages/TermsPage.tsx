import React from 'react';
import styled, { keyframes } from 'styled-components';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import { TERMS_OF_SERVICE } from '../../constants';

interface TermsPageProps {
  onBack: () => void;
}

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background-color: black;
  animation: ${slideIn} 0.3s ease-out;
  max-width: 768px;
  margin: 0 auto;
`;

const Content = styled.div`
  padding: 24px;
`;

const TermsText = styled.div`
  font-size: 14px;
  color: #9ca3af;
  white-space: pre-wrap;
  line-height: 1.8;
`;

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  return (
    <Container>
      <SubPageHeader title="Terms of Service" onBack={onBack} />
      <Content>
        <TermsText>{TERMS_OF_SERVICE}</TermsText>
      </Content>
    </Container>
  );
};

export default TermsPage;
