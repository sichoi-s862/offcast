import React from 'react';
import styled, { keyframes } from 'styled-components';
import {
  ChevronRight,
  AlignLeft,
  FileText,
  Edit3,
  Shield,
  MessageSquare,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { PlatformIcon } from '../../components/common/PlatformIcon';
import type { CurrentUser } from '../../types';

type Screen = 'main' | 'my_posts' | 'my_info' | 'edit_nick' | 'contact' | 'customer_center' | 'privacy';

interface MyPageViewProps {
  currentUser: CurrentUser;
  onLogout: () => void;
  onNavigate: (screen: Screen) => void;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Container = styled.div`
  padding-bottom: 80px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const Content = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProfileCard = styled.div`
  background-color: #111827;
  border-radius: 8px;
  border: 1px solid #1f2937;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: white;
`;

const ProfileMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 4px;
`;

const SubscriberBadge = styled.span`
  background-color: #1f2937;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #374151;
  color: #9ca3af;
`;

const MenuCard = styled.div`
  background-color: #111827;
  border-radius: 8px;
  border: 1px solid #1f2937;
  overflow: hidden;
`;

const MenuItem = styled.button<{ $danger?: boolean }>`
  width: 100%;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1f2937;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #1f2937;
  }
`;

const MenuItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MenuIcon = styled.div<{ $danger?: boolean }>`
  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.$danger ? '#f87171' : '#9ca3af'};
  }
`;

const MenuText = styled.span<{ $danger?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$danger ? '#f87171' : '#e5e7eb'};
`;

const ChevronIcon = styled.div`
  svg {
    width: 16px;
    height: 16px;
    color: #6b7280;
  }
`;

export const MyPageView: React.FC<MyPageViewProps> = ({
  currentUser,
  onLogout,
  onNavigate
}) => {
  return (
    <Container>
      <Content>
        <ProfileCard>
          <ProfileHeader>
            <PlatformIcon provider={currentUser.provider} size={32} />
            <ProfileName>{currentUser.nickname}</ProfileName>
          </ProfileHeader>
          <ProfileMeta>
            <SubscriberBadge>구독자 {currentUser.subscriberCount}</SubscriberBadge>
          </ProfileMeta>
        </ProfileCard>

        <MenuCard>
          <MenuItem onClick={() => onNavigate('my_posts')}>
            <MenuItemLeft>
              <MenuIcon><AlignLeft /></MenuIcon>
              <MenuText>내가 쓴 글</MenuText>
            </MenuItemLeft>
            <ChevronIcon><ChevronRight /></ChevronIcon>
          </MenuItem>
          <MenuItem onClick={() => onNavigate('my_info')}>
            <MenuItemLeft>
              <MenuIcon><FileText /></MenuIcon>
              <MenuText>내 정보</MenuText>
            </MenuItemLeft>
            <ChevronIcon><ChevronRight /></ChevronIcon>
          </MenuItem>
          <MenuItem onClick={() => onNavigate('edit_nick')}>
            <MenuItemLeft>
              <MenuIcon><Edit3 /></MenuIcon>
              <MenuText>닉네임 수정</MenuText>
            </MenuItemLeft>
            <ChevronIcon><ChevronRight /></ChevronIcon>
          </MenuItem>
        </MenuCard>

        <MenuCard>
          <MenuItem onClick={() => onNavigate('privacy')}>
            <MenuItemLeft>
              <MenuIcon><Shield /></MenuIcon>
              <MenuText>개인정보 처리방침</MenuText>
            </MenuItemLeft>
            <ChevronIcon><ChevronRight /></ChevronIcon>
          </MenuItem>
          <MenuItem onClick={() => onNavigate('contact')}>
            <MenuItemLeft>
              <MenuIcon><MessageSquare /></MenuIcon>
              <MenuText>문의하기</MenuText>
            </MenuItemLeft>
            <ChevronIcon><ChevronRight /></ChevronIcon>
          </MenuItem>
          <MenuItem onClick={() => onNavigate('customer_center')}>
            <MenuItemLeft>
              <MenuIcon><HelpCircle /></MenuIcon>
              <MenuText>고객센터</MenuText>
            </MenuItemLeft>
            <ChevronIcon><ChevronRight /></ChevronIcon>
          </MenuItem>
        </MenuCard>

        <MenuCard>
          <MenuItem onClick={onLogout}>
            <MenuItemLeft>
              <MenuIcon $danger><LogOut /></MenuIcon>
              <MenuText $danger>로그아웃</MenuText>
            </MenuItemLeft>
          </MenuItem>
        </MenuCard>
      </Content>
    </Container>
  );
};

export default MyPageView;
