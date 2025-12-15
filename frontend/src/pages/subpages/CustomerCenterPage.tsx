import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Loader2 } from 'lucide-react';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import { getFaqs, type FaqResponse } from '../../api';

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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
`;

const Spinner = styled(Loader2)`
  color: #6b7280;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #6b7280;
  padding: 48px 0;
  font-size: 14px;
`;

const ErrorMessage = styled.p`
  text-align: center;
  color: #f87171;
  padding: 48px 0;
  font-size: 14px;
`;

export const CustomerCenterPage: React.FC<CustomerCenterPageProps> = ({ onBack }) => {
  const [faqs, setFaqs] = useState<FaqResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getFaqs();
        setFaqs(response.faqs);
      } catch (err) {
        console.error('FAQ 로딩 실패:', err);
        setError('FAQ를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <Container>
      <SubPageHeader title="고객센터" onBack={onBack} />
      <Content>
        {isLoading ? (
          <LoadingContainer>
            <Spinner size={32} />
          </LoadingContainer>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : faqs.length === 0 ? (
          <EmptyMessage>등록된 FAQ가 없습니다.</EmptyMessage>
        ) : (
          faqs.map((faq) => (
            <FaqCard key={faq.id}>
              <Question>
                <QuestionMark>Q.</QuestionMark> {faq.question}
              </Question>
              <Answer>A. {faq.answer}</Answer>
            </FaqCard>
          ))
        )}
      </Content>
    </Container>
  );
};

export default CustomerCenterPage;
