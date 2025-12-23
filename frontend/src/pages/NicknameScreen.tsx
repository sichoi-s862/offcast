import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { ChevronLeft, ChevronRight, Loader2, Check, ArrowRight } from 'lucide-react';

interface AgreementState {
  termsOfService: boolean;
  privacyPolicy: boolean;
  marketing: boolean;
}

interface NicknameScreenProps {
  onComplete: (nickname: string, agreements: AgreementState) => void;
  onBack?: () => void;
  onViewTerms?: () => void;
  onViewPrivacy?: () => void;
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
  overflow-y: auto;
`;

const BackButton = styled.button`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 24px;
  margin-left: -10px;
  border-radius: 8px;

  &:hover {
    background-color: #1f2937;
  }

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
    color: #9ca3af;
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
  color: #9ca3af;
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
  margin-bottom: 24px;
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

// 약관 동의 섹션
const AgreementSection = styled.div`
  margin-bottom: 24px;
  flex: 1;
`;

const AgreementTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
`;

const AgreementList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AgreementItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Checkbox = styled.button<{ $checked: boolean }>`
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 6px;
  border: 2px solid ${props => props.$checked ? '#00D4AA' : '#4b5563'};
  background-color: ${props => props.$checked ? '#00D4AA' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  svg {
    width: 14px;
    height: 14px;
    color: white;
    opacity: ${props => props.$checked ? 1 : 0};
  }
`;

const AgreementLabel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AgreementText = styled.span`
  font-size: 14px;
  color: #e5e7eb;
`;

const RequiredBadge = styled.span`
  font-size: 12px;
  color: #ef4444;
  font-weight: 600;
`;

const OptionalBadge = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const ViewButton = styled.button`
  color: #9ca3af;
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: white;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const AllAgreeItem = styled(AgreementItem)`
  padding: 12px;
  background-color: #1f2937;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const AllAgreeText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: white;
`;

const Divider = styled.div`
  height: 1px;
  background-color: #374151;
  margin: 8px 0;
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
  color: ${props => props.$active ? 'white' : '#9ca3af'};
  cursor: ${props => props.$active ? 'pointer' : 'not-allowed'};

  &:hover {
    background-color: ${props => props.$active ? '#00B894' : '#1f2937'};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const NicknameScreen: React.FC<NicknameScreenProps> = ({
  onComplete,
  onBack,
  onViewTerms,
  onViewPrivacy
}) => {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [agreements, setAgreements] = useState<AgreementState>({
    termsOfService: false,
    privacyPolicy: false,
    marketing: false,
  });

  // 닉네임 유효성 검사 (2-10자)
  const isValidNickname = nickname.length >= 2 && nickname.length <= 10;

  // 필수 약관 동의 여부
  const hasRequiredAgreements = agreements.termsOfService && agreements.privacyPolicy;

  // 전체 동의 여부
  const allAgreed = agreements.termsOfService && agreements.privacyPolicy && agreements.marketing;

  // 제출 가능 여부
  const canSubmit = isValidNickname && hasRequiredAgreements && status !== 'checking';

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

  const handleToggleAgreement = (key: keyof AgreementState) => {
    setAgreements(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleAll = () => {
    const newValue = !allAgreed;
    setAgreements({
      termsOfService: newValue,
      privacyPolicy: newValue,
      marketing: newValue,
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    // 중복 확인을 했으면 바로 진행, 안했으면 확인 후 진행
    if (status === 'success') {
      onComplete(nickname, agreements);
    } else {
      // 중복 확인 후 자동 진행
      setStatus('checking');
      setTimeout(() => {
        if (nickname === 'admin' || nickname === 'blind') {
          setStatus('error');
          setErrorMessage('This nickname is already taken.');
        } else {
          onComplete(nickname, agreements);
        }
      }, 500);
    }
  };

  return (
    <Container>
      {onBack && (
        <BackButton onClick={onBack} aria-label="Go back">
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

      <AgreementSection>
        <AgreementTitle>Terms & Agreements</AgreementTitle>

        <AllAgreeItem>
          <Checkbox $checked={allAgreed} onClick={handleToggleAll}>
            <Check />
          </Checkbox>
          <AllAgreeText>Agree to all</AllAgreeText>
        </AllAgreeItem>

        <Divider />

        <AgreementList>
          <AgreementItem>
            <Checkbox
              $checked={agreements.termsOfService}
              onClick={() => handleToggleAgreement('termsOfService')}
            >
              <Check />
            </Checkbox>
            <AgreementLabel>
              <AgreementText>Terms of Service</AgreementText>
              <RequiredBadge>(Required)</RequiredBadge>
            </AgreementLabel>
            {onViewTerms && (
              <ViewButton onClick={onViewTerms} aria-label="View Terms of Service">
                <ChevronRight />
              </ViewButton>
            )}
          </AgreementItem>

          <AgreementItem>
            <Checkbox
              $checked={agreements.privacyPolicy}
              onClick={() => handleToggleAgreement('privacyPolicy')}
            >
              <Check />
            </Checkbox>
            <AgreementLabel>
              <AgreementText>Privacy Policy</AgreementText>
              <RequiredBadge>(Required)</RequiredBadge>
            </AgreementLabel>
            {onViewPrivacy && (
              <ViewButton onClick={onViewPrivacy} aria-label="View Privacy Policy">
                <ChevronRight />
              </ViewButton>
            )}
          </AgreementItem>

          <AgreementItem>
            <Checkbox
              $checked={agreements.marketing}
              onClick={() => handleToggleAgreement('marketing')}
            >
              <Check />
            </Checkbox>
            <AgreementLabel>
              <AgreementText>Marketing Communications</AgreementText>
              <OptionalBadge>(Optional)</OptionalBadge>
            </AgreementLabel>
          </AgreementItem>
        </AgreementList>
      </AgreementSection>

      <SubmitButton
        $active={canSubmit}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {status === 'checking' ? <SpinnerIcon /> : <>Get Started <ArrowRight /></>}
      </SubmitButton>
    </Container>
  );
};

export default NicknameScreen;
