import React, { useState } from 'react';
import styled from 'styled-components';
import { REPORT_REASONS } from '../../constants';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
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
  border: 1px solid ${props => props.$selected ? '#7c3aed' : '#4b5563'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RadioDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #7c3aed;
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

  ${props => props.$primary ? `
    background-color: ${props.$disabled ? '#374151' : '#7c3aed'};
    color: ${props.$disabled ? '#6b7280' : 'white'};
    cursor: ${props.$disabled ? 'not-allowed' : 'pointer'};

    &:hover {
      background-color: ${props.$disabled ? '#374151' : '#6d28d9'};
    }
  ` : `
    background-color: #1f2937;
    color: #d1d5db;

    &:hover {
      background-color: #374151;
    }
  `}
`;

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason);
      setSelectedReason(null);
    }
  };

  return (
    <Overlay>
      <Backdrop onClick={onClose} />
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>신고하기</ModalTitle>
          <ModalSubtitle>신고 사유를 선택해주세요.</ModalSubtitle>
        </ModalHeader>
        <ModalBody>
          {REPORT_REASONS.map((reason, idx) => (
            <RadioLabel key={idx}>
              <RadioCircle $selected={selectedReason === reason}>
                {selectedReason === reason && <RadioDot />}
              </RadioCircle>
              <RadioInput
                type="radio"
                name="report"
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
              />
              <RadioText $selected={selectedReason === reason}>{reason}</RadioText>
            </RadioLabel>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>취소</Button>
          <Button
            $primary
            $disabled={!selectedReason}
            onClick={handleSubmit}
            disabled={!selectedReason}
          >
            신고
          </Button>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};

export default ReportModal;
