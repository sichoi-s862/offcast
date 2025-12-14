import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Check } from 'lucide-react';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import { PlatformIcon } from '../../components/common/PlatformIcon';
import type { CurrentUser } from '../../types';

interface MyInfoPageProps {
  currentUser: CurrentUser;
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
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Field = styled.div``;

const FieldLabel = styled.label`
  font-size: 14px;
  color: #6b7280;
  display: block;
  margin-bottom: 8px;
`;

const FieldValue = styled.div`
  color: white;
  font-size: 18px;
  font-weight: 700;
  padding: 16px;
  background-color: #111827;
  border-radius: 12px;
  border: 1px solid #1f2937;
`;

const PlatformValue = styled(FieldValue)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CheckBadge = styled.div`
  margin-left: auto;

  svg {
    width: 20px;
    height: 20px;
    color: #22c55e;
  }
`;

export const MyInfoPage: React.FC<MyInfoPageProps> = ({ currentUser, onBack }) => {
  return (
    <Container>
      <SubPageHeader title="내 정보" onBack={onBack} />
      <Content>
        <Field>
          <FieldLabel>연동된 계정</FieldLabel>
          <PlatformValue>
            <PlatformIcon provider={currentUser.provider} size={24} />
            {currentUser.provider}
            <CheckBadge>
              <Check />
            </CheckBadge>
          </PlatformValue>
        </Field>
        <Field>
          <FieldLabel>닉네임</FieldLabel>
          <FieldValue>{currentUser.nickname}</FieldValue>
        </Field>
        <Field>
          <FieldLabel>구독자 수</FieldLabel>
          <FieldValue>
            {currentUser.subscriberCount} (Raw: {currentUser.rawSubCount})
          </FieldValue>
        </Field>
      </Content>
    </Container>
  );
};

export default MyInfoPage;
