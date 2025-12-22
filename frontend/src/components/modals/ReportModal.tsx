import React, { useState } from 'react';
import styled from 'styled-components';
import { Loader2 } from 'lucide-react';
import { REPORT_REASONS } from '../../constants';
import { createReport, type CreateReportDto, type ReportTargetType, type ReportReason } from '../../api';
import { getErrorMessage } from '../../api/client';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  targetType: ReportTargetType;
  postId?: string;
  commentId?: string;
  targetUserId?: string;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 384px;
  background-color: #111827;
  border-radius: 16px;
  border: 1px solid #1f2937;
  overflow: hidden;
  animation: zoomIn 0.2s ease-out;

  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #1f2937;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: white;
`;

const ModalSubtitle = styled.p`
  font-size: 14px;
  color: #9ca3af;
  margin-top: 4px;
`;

const ModalBody = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  &:hover span {
    color: white;
  }
`;

const RadioCircle = styled.div<{ $selected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid ${props => props.$selected ? '#00D4AA' : '#4b5563'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RadioDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #00D4AA;
`;

const RadioInput = styled.input`
  display: none;
`;

const RadioText = styled.span<{ $selected: boolean }>`
  font-size: 14px;
  color: ${props => props.$selected ? 'white' : '#d1d5db'};
`;

const ModalFooter = styled.div`
  padding: 16px;
  background-color: rgba(31, 41, 55, 0.5);
  display: flex;
  gap: 12px;
`;

const Button = styled.button<{ $primary?: boolean; $disabled?: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${props => props.$primary ? `
    background-color: ${props.$disabled ? '#374151' : '#00D4AA'};
    color: ${props.$disabled ? '#6b7280' : 'white'};
    cursor: ${props.$disabled ? 'not-allowed' : 'pointer'};

    &:hover {
      background-color: ${props.$disabled ? '#374151' : '#00B894'};
    }
  ` : `
    background-color: #1f2937;
    color: #d1d5db;

    &:hover {
      background-color: #374151;
    }
  `}
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

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  targetType,
  postId,
  commentId,
  targetUserId,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const reportData: CreateReportDto = {
        targetType,
        reason: selectedReason as ReportReason,
        ...(postId && { postId }),
        ...(commentId && { commentId }),
        ...(targetUserId && { targetUserId }),
      };

      await createReport(reportData);
      setSelectedReason(null);
      onSubmit();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to submit report.');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Overlay>
      <Backdrop onClick={handleClose} />
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>Report</ModalTitle>
          <ModalSubtitle>Please select a reason for reporting.</ModalSubtitle>
        </ModalHeader>
        <ModalBody>
          {REPORT_REASONS.map((reason, idx) => (
            <RadioLabel key={idx}>
              <RadioCircle $selected={selectedReason === reason.value}>
                {selectedReason === reason.value && <RadioDot />}
              </RadioCircle>
              <RadioInput
                type="radio"
                name="report"
                checked={selectedReason === reason.value}
                onChange={() => setSelectedReason(reason.value)}
                disabled={isSubmitting}
              />
              <RadioText $selected={selectedReason === reason.value}>{reason.label}</RadioText>
            </RadioLabel>
          ))}
          {error && (
            <RadioText $selected={false} style={{ color: '#f87171', marginTop: '8px' }}>
              {error}
            </RadioText>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            $primary
            $disabled={!selectedReason || isSubmitting}
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? <><Spinner /> Submitting...</> : 'Report'}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};

export default ReportModal;
