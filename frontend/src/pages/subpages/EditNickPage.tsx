import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Loader2 } from 'lucide-react';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import { updateNickname } from '../../api';
import { getErrorMessage } from '../../api/client';
import type { CurrentUser, ApiUser } from '../../types';

interface EditNickPageProps {
  currentUser: CurrentUser;
  onBack: () => void;
  onUpdateNickname: (nickname: string, user?: ApiUser) => void;
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

const Input = styled.input`
  width: 100%;
  background-color: #111827;
  color: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #1f2937;
  outline: none;
  font-size: 16px;
  margin-bottom: 8px;

  &:focus {
    border-color: white;
  }
`;

const HelpText = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 32px;
`;

const SaveButton = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: 16px;
  background-color: ${props => props.$disabled ? '#374151' : '#7c3aed'};
  border-radius: 12px;
  color: ${props => props.$disabled ? '#6b7280' : 'white'};
  font-weight: 700;
  font-size: 16px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};

  &:hover {
    background-color: ${props => props.$disabled ? '#374151' : '#6d28d9'};
  }
`;

const Spinner = styled(Loader2)`
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: #f87171;
  margin-bottom: 16px;
`;

export const EditNickPage: React.FC<EditNickPageProps> = ({
  currentUser,
  onBack,
  onUpdateNickname
}) => {
  const [val, setVal] = useState(currentUser.nickname || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = val.trim().length >= 2 && val.trim() !== (currentUser.nickname || '');

  const handleSave = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateNickname(val.trim());
      onUpdateNickname(val.trim(), result.user);
      onBack();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, '닉네임 변경에 실패했습니다.');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <SubPageHeader title="닉네임 수정" onBack={onBack} />
      <Content>
        <Input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          disabled={isSubmitting}
        />
        <HelpText>2자 이상 입력해주세요.</HelpText>
        {error && <ErrorText>{error}</ErrorText>}
        <SaveButton
          $disabled={!isValid || isSubmitting}
          onClick={handleSave}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? <><Spinner /> 저장 중...</> : '저장하기'}
        </SaveButton>
      </Content>
    </Container>
  );
};

export default EditNickPage;
