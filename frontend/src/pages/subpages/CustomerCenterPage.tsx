import React from 'react';
import styled, { keyframes } from 'styled-components';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import { FAQS } from '../../constants';

interface CustomerCenterPageProps {
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FaqCard = styled.div`
  background-color: #111827;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #1f2937;
`;

const Question = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const QuestionMark = styled.span`
  color: #7c3aed;
`;

const Answer = styled.p`
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.6;
  padding-left: 20px;
`;

export const CustomerCenterPage: React.FC<CustomerCenterPageProps> = ({ onBack }) => {
  return (
    <Container>
      <SubPageHeader title="고객센터" onBack={onBack} />
      <Content>
        {FAQS.map((faq, i) => (
          <FaqCard key={i}>
            <Question>
              <QuestionMark>Q.</QuestionMark> {faq.q}
            </Question>
            <Answer>A. {faq.a}</Answer>
          </FaqCard>
        ))}
      </Content>
    </Container>
  );
};

export default CustomerCenterPage;
