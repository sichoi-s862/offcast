import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import { withdrawUser } from '../../api';

interface WithdrawPageProps {
  onBack: () => void;
  onWithdrawSuccess: () => void;
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

const WarningCard = styled.div`
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
`;

const WarningIcon = styled.div`
  width: 56px;
  height: 56px;
  background-color: rgba(239, 68, 68, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 28px;
    height: 28px;
    color: #ef4444;
  }
`;

const WarningTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
`;

const WarningText = styled.p`
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.6;
`;

const InfoList = styled.ul`
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 20px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoItem = styled.li`
  font-size: 14px;
  color: #9ca3af;
  padding-left: 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 6px;
    height: 6px;
    background-color: #6b7280;
    border-radius: 50%;
  }
`;

const ConfirmSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: #ef4444;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
`;

const CheckboxText = styled.span`
  font-size: 14px;
  color: #e5e7eb;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

const WithdrawButton = styled.button<{ disabled: boolean }>`
  width: 100%;
  padding: 16px;
  background-color: ${props => props.disabled ? '#374151' : '#ef4444'};
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.disabled ? '#6b7280' : 'white'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background-color: #dc2626;
  }
`;

const CancelButton = styled.button`
  width: 100%;
  padding: 16px;
  background-color: #1f2937;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #374151;
  }
`;

const Spinner = styled(Loader2)`
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export const WithdrawPage: React.FC<WithdrawPageProps> = ({ onBack, onWithdrawSuccess }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!isConfirmed || isLoading) return;

    setIsLoading(true);
    try {
      await withdrawUser();
      onWithdrawSuccess();
    } catch (error) {
      console.error('Failed to withdraw:', error);
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <SubPageHeader title="Delete Account" onBack={onBack} />
      <Content>
        <WarningCard>
          <WarningIcon>
            <AlertTriangle />
          </WarningIcon>
          <WarningTitle>Are you sure you want to delete your account?</WarningTitle>
          <WarningText>
            This action cannot be undone. All your data will be permanently deleted.
          </WarningText>
        </WarningCard>

        <InfoList>
          <InfoItem>All your posts and comments will be deleted</InfoItem>
          <InfoItem>Your profile and account information will be removed</InfoItem>
          <InfoItem>You will lose access to all channels you have joined</InfoItem>
          <InfoItem>This action is permanent and cannot be reversed</InfoItem>
        </InfoList>

        <ConfirmSection>
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
            />
            <CheckboxText>
              I understand that this action is permanent and all my data will be deleted.
            </CheckboxText>
          </CheckboxLabel>

          <ButtonGroup>
            <WithdrawButton
              disabled={!isConfirmed || isLoading}
              onClick={handleWithdraw}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Deleting...
                </>
              ) : (
                'Delete My Account'
              )}
            </WithdrawButton>
            <CancelButton onClick={onBack}>
              Cancel
            </CancelButton>
          </ButtonGroup>
        </ConfirmSection>
      </Content>
    </Container>
  );
};

export default WithdrawPage;
