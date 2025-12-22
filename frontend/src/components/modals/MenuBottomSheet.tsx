import React from 'react';
import styled from 'styled-components';
import { CornerDownRight, Flag, Ban } from 'lucide-react';

interface MenuBottomSheetProps {
  isOpen: boolean;
  isComment?: boolean;
  onClose: () => void;
  onReply?: () => void;
  onReport: () => void;
  onBlock: () => void;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const SheetContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 768px;
  background-color: #111827;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border-top: 1px solid #1f2937;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const Handle = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 12px;
  padding-bottom: 8px;
`;

const HandleBar = styled.div`
  width: 40px;
  height: 4px;
  background-color: #374151;
  border-radius: 9999px;
`;

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px;
`;

const MenuItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  color: ${props => props.$danger ? '#f87171' : 'white'};
  border-radius: 8px;
  transition: background-color 0.2s;
  width: 100%;
  text-align: left;

  &:hover {
    background-color: #1f2937;
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.$danger ? '#f87171' : '#9ca3af'};
  }
`;

const MenuText = styled.span`
  font-weight: 500;
`;

const SafeArea = styled.div`
  height: env(safe-area-inset-bottom);
  background-color: #111827;
`;

export const MenuBottomSheet: React.FC<MenuBottomSheetProps> = ({
  isOpen,
  isComment = false,
  onClose,
  onReply,
  onReport,
  onBlock
}) => {
  if (!isOpen) return null;

  return (
    <Overlay>
      <Backdrop onClick={onClose} />
      <SheetContainer>
        <Handle>
          <HandleBar />
        </Handle>
        <MenuList>
          {isComment && onReply && (
            <MenuItem onClick={() => { onReply(); onClose(); }}>
              <CornerDownRight />
              <MenuText>Reply</MenuText>
            </MenuItem>
          )}
          <MenuItem $danger onClick={() => { onReport(); onClose(); }}>
            <Flag />
            <MenuText>Report</MenuText>
          </MenuItem>
          <MenuItem onClick={() => { onBlock(); onClose(); }}>
            <Ban />
            <MenuText>Block this user</MenuText>
          </MenuItem>
        </MenuList>
        <SafeArea />
      </SheetContainer>
    </Overlay>
  );
};

export default MenuBottomSheet;
