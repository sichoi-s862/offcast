import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { ChevronLeft, Loader2, Check, ArrowRight } from 'lucide-react';

interface NicknameScreenProps {
  onComplete: (nickname: string) => void;
  onBack?: () => void;
}

type Status = 'idle' | 'checking' | 'success' | 'error';

const slideInFromRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  height: 100vh;
  background-color: black;
  display: flex;
  flex-direction: column;
  padding: 48px 24px 0;
  animation: ${slideInFromRight} 0.5s ease-out;
  max-width: 768px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 32px;

  svg {
    width: 24px;
    height: 24px;
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 32px;
`;

const InputWrapper = styled.div`
  position: relative;
  margin-bottom: 8px;
`;

const Input = styled.input<{ $status: Status }>`
  width: 100%;
  background-color: #111827;
  color: white;
  padding: 16px;
  border-radius: 8px;
  outline: none;
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'error': return '#ef4444';
      case 'success': return '#22c55e';
      default: return '#1f2937';
    }
  }};

  &:focus {
    border-color: ${props => {
      switch (props.$status) {
        case 'error': return '#ef4444';
        case 'success': return '#22c55e';
        default: return 'white';
      }
    }};
  }

  &::placeholder {
    color: #6b7280;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
`;

const SpinnerIcon = styled(Loader2)`
  width: 20px;
  height: 20px;
  color: #6b7280;
  animation: ${spin} 1s linear infinite;
`;

const CheckIcon = styled(Check)`
  width: 20px;
  height: 20px;
  color: #22c55e;
`;

const MessageRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: auto;
`;

const StatusMessage = styled.span<{ $error?: boolean }>`
  font-size: 12px;
  color: ${props => props.$error ? '#ef4444' : '#22c55e'};
  height: 16px;
`;

const CheckButton = styled.button`
  font-size: 12px;
  color: #9ca3af;
  text-decoration: underline;
  padding: 4px;

  &:hover {
    color: white;
  }
`;

const SubmitButton = styled.button<{ $active: boolean }>`
  width: 100%;
  height: 56px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  background-color: ${props => props.$active ? '#00D4AA' : '#1f2937'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  cursor: ${props => props.$active ? 'pointer' : 'not-allowed'};

  &:hover {
    background-color: ${props => props.$active ? '#00B894' : '#1f2937'};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const NicknameScreen: React.FC<NicknameScreenProps> = ({ onComplete, onBack }) => {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 닉네임 유효성 검사 (2-10자)
  const isValidNickname = nickname.length >= 2 && nickname.length <= 10;

  const handleCheck = () => {
    if (nickname.length < 2) {
      setStatus('error');
      setErrorMessage('Please enter at least 2 characters.');
      return;
    }
    if (nickname.length > 10) {
      setStatus('error');
      setErrorMessage('Please enter 10 characters or less.');
      return;
    }
    setStatus('checking');
    setTimeout(() => {
      if (nickname === 'admin' || nickname === 'blind') {
        setStatus('error');
        setErrorMessage('This nickname is already taken.');
      } else {
        setStatus('success');
      }
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    setStatus('idle');
  };

  const handleSubmit = () => {
    if (!isValidNickname) return;

    // 중복 확인을 했으면 바로 진행, 안했으면 확인 후 진행
    if (status === 'success') {
      onComplete(nickname);
    } else {
      // 중복 확인 후 자동 진행
      setStatus('checking');
      setTimeout(() => {
        if (nickname === 'admin' || nickname === 'blind') {
          setStatus('error');
          setErrorMessage('This nickname is already taken.');
        } else {
          onComplete(nickname);
        }
      }, 500);
    }
  };

  return (
    <Container>
      {onBack && (
        <BackButton onClick={onBack}>
          <ChevronLeft />
        </BackButton>
      )}

      <Title>Set your nickname</Title>
      <Subtitle>This name will be displayed in the community.</Subtitle>

      <InputWrapper>
        <Input
          type="text"
          value={nickname}
          onChange={handleChange}
          placeholder="2-10 characters"
          $status={status}
        />
        <InputIcon>
          {status === 'checking' && <SpinnerIcon />}
          {status === 'success' && <CheckIcon />}
        </InputIcon>
      </InputWrapper>

      <MessageRow>
        <StatusMessage $error={status === 'error'}>
          {status === 'error' ? errorMessage : status === 'success' ? 'Nickname is available!' : ''}
        </StatusMessage>
        {status !== 'success' && (
          <CheckButton onClick={handleCheck}>
            Check
          </CheckButton>
        )}
      </MessageRow>

      <SubmitButton
        $active={isValidNickname && status !== 'checking'}
        disabled={!isValidNickname || status === 'checking'}
        onClick={handleSubmit}
      >
        {status === 'checking' ? <SpinnerIcon /> : <>Get Started <ArrowRight /></>}
      </SubmitButton>
    </Container>
  );
};

export default NicknameScreen;
