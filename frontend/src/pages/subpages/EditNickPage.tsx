import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import type { CurrentUser } from '../../types';

interface EditNickPageProps {
  currentUser: CurrentUser;
  onBack: () => void;
  onUpdateNickname: (nickname: string) => void;
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

const SaveButton = styled.button`
  width: 100%;
  padding: 16px;
  background-color: #7c3aed;
  border-radius: 12px;
  color: white;
  font-weight: 700;
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #6d28d9;
  }
`;

export const EditNickPage: React.FC<EditNickPageProps> = ({
  currentUser,
  onBack,
  onUpdateNickname
}) => {
  const [val, setVal] = useState(currentUser.nickname);

  const handleSave = () => {
    if (val.trim().length >= 2) {
      onUpdateNickname(val);
      onBack();
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
        />
        <HelpText>2자 이상 입력해주세요.</HelpText>
        <SaveButton onClick={handleSave}>저장하기</SaveButton>
      </Content>
    </Container>
  );
};

export default EditNickPage;
