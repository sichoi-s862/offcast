import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Send } from 'lucide-react';
import { SubPageHeader } from '../../components/common/SubPageHeader';

interface ContactPageProps {
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

const Description = styled.p`
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 16px;
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 192px;
  background-color: #111827;
  color: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #1f2937;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 24px;

  &:focus {
    border-color: white;
  }

  &::placeholder {
    color: #6b7280;
  }
`;

const SubmitButton = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: ${props => props.$active ? '#3b82f6' : '#1f2937'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  cursor: ${props => props.$active ? 'pointer' : 'not-allowed'};

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [msg, setMsg] = useState('');

  const handleSubmit = () => {
    if (msg.trim()) {
      alert("문의가 접수되었습니다.");
      onBack();
    }
  };

  return (
    <Container>
      <SubPageHeader title="문의하기" onBack={onBack} />
      <Content>
        <Description>
          서비스 이용 중 불편한 점이나 제안하실 내용이 있다면 보내주세요.
        </Description>
        <Textarea
          placeholder="내용을 입력해주세요."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <SubmitButton
          $active={!!msg.trim()}
          onClick={handleSubmit}
          disabled={!msg.trim()}
        >
          보내기 <Send />
        </SubmitButton>
      </Content>
    </Container>
  );
};

export default ContactPage;
