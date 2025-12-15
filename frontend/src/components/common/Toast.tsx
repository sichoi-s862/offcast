import React from 'react';
import styled, { keyframes } from 'styled-components';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, type ToastType } from '../../stores/toastStore';

const slideIn = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: calc(100vw - 32px);
  width: 100%;
  max-width: 400px;
  pointer-events: none;
`;

const getBackgroundColor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return '#10b981';
    case 'error':
      return '#ef4444';
    case 'warning':
      return '#f59e0b';
    case 'info':
    default:
      return '#3b82f6';
  }
};

const ToastItem = styled.div<{ $type: ToastType }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background-color: ${(props) => getBackgroundColor(props.$type)};
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: ${slideIn} 0.3s ease-out;
  pointer-events: auto;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Message = styled.span`
  flex: 1;
  line-height: 1.4;
  word-break: keep-all;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  transition: background 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle />;
    case 'error':
      return <AlertCircle />;
    case 'warning':
      return <AlertTriangle />;
    case 'info':
    default:
      return <Info />;
  }
};

export const ToastProvider: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <ToastContainer>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} $type={toast.type}>
          <IconWrapper>{getIcon(toast.type)}</IconWrapper>
          <Message>{toast.message}</Message>
          <CloseButton onClick={() => removeToast(toast.id)}>
            <X />
          </CloseButton>
        </ToastItem>
      ))}
    </ToastContainer>
  );
};

export default ToastProvider;
