import React from 'react';
import styled, { keyframes } from 'styled-components';
import { OffcastLogo } from '../components/icons/PlatformIcons';
import type { Provider } from '../types';

import youtubeIcon from '../assets/youtube_icon.svg';
import tiktokIcon from '../assets/tiktok_icon.svg';
import chzzkIcon from '../assets/chzzk_icon.svg'; // Twitter 아이콘 임시 사용

interface LoginScreenProps {
  onLogin: (provider: Provider | string) => void;
}

const slideInFromBottom = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background-color: black;
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  animation: ${slideInFromBottom} 0.5s ease-out;
  overflow: hidden;
  max-width: 768px;
  margin: 0 auto;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
`;

const LogoWrapper = styled.div`
  width: 64px;
  height: 64px;
  background-color: #00D4AA;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: white;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #9ca3af;
  text-align: center;
  margin-bottom: 32px;
  font-size: 14px;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LoginButton = styled.button`
  width: 100%;
  height: 48px;
  background-color: #282828;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #1f2937;
  transition: background-color 0.2s;

  &:hover {
    background-color: #3d3d3d;
  }

`;

const ButtonText = styled.span`
  color: white;
  font-weight: 500;
  font-size: 16px;
`;

const PlatformIconImg = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
`;

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <Container>
      <Content>
        <LogoWrapper>
          <OffcastLogo size={36} />
        </LogoWrapper>
        <Title>Welcome!</Title>
        <Subtitle>
          Log in with your platform<br />
          and share your honest stories.
        </Subtitle>

        <ButtonGroup>
          <LoginButton onClick={() => onLogin('youtube')}>
            <PlatformIconImg src={youtubeIcon} alt="YouTube" />
            <ButtonText>Continue with YouTube</ButtonText>
          </LoginButton>

          <LoginButton onClick={() => onLogin('twitter')}>
            <PlatformIconImg src={chzzkIcon} alt="Twitter" />
            <ButtonText>Continue with Twitter</ButtonText>
          </LoginButton>

          <LoginButton onClick={() => onLogin('tiktok')}>
            <PlatformIconImg src={tiktokIcon} alt="TikTok" />
            <ButtonText>Continue with TikTok</ButtonText>
          </LoginButton>
        </ButtonGroup>
      </Content>
    </Container>
  );
};

export default LoginScreen;
