import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Youtube, Instagram } from 'lucide-react';
import { TikTokIcon, ChzzkIcon, SoopIcon, OffcastLogo } from '../components/icons/PlatformIcons';
import type { Provider } from '../types';

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
  height: 100vh;
  background-color: black;
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  animation: ${slideInFromBottom} 0.5s ease-out;
  overflow-y: auto;
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
  background-color: #7c3aed;
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
  gap: 12px;
  border: 1px solid #1f2937;
  transition: background-color 0.2s;

  &:hover {
    background-color: #3d3d3d;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ButtonText = styled.span`
  color: white;
  font-weight: 500;
  font-size: 14px;
`;

const YouTubeIcon = styled(Youtube)`
  color: #ef4444;
`;

const InstagramIcon = styled(Instagram)`
  color: #ec4899;
`;

const StyledTikTokIcon = styled(TikTokIcon)`
  color: #22d3ee;
`;

const StyledChzzkIcon = styled(ChzzkIcon)`
  color: #00FFA3;
`;

const StyledSoopIcon = styled(SoopIcon)`
  color: #3b82f6;
`;

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <Container>
      <Content>
        <LogoWrapper>
          <OffcastLogo size={36} />
        </LogoWrapper>
        <Title>환영합니다!</Title>
        <Subtitle>
          다양한 플랫폼으로 로그인하여<br />
          솔직한 이야기를 나눠보세요.
        </Subtitle>

        <ButtonGroup>
          <LoginButton onClick={() => onLogin('youtube')}>
            <YouTubeIcon />
            <ButtonText>YouTube로 계속하기</ButtonText>
          </LoginButton>

          <LoginButton onClick={() => onLogin('instagram')}>
            <InstagramIcon />
            <ButtonText>Instagram으로 계속하기</ButtonText>
          </LoginButton>

          <LoginButton onClick={() => onLogin('chzzk')}>
            <StyledChzzkIcon size={20} />
            <ButtonText>치지직으로 계속하기</ButtonText>
          </LoginButton>

          <LoginButton onClick={() => onLogin('soop')}>
            <StyledSoopIcon size={20} />
            <ButtonText>SOOP으로 계속하기</ButtonText>
          </LoginButton>

          <LoginButton onClick={() => onLogin('tiktok')}>
            <StyledTikTokIcon size={20} />
            <ButtonText>TikTok으로 계속하기</ButtonText>
          </LoginButton>
        </ButtonGroup>
      </Content>
    </Container>
  );
};

export default LoginScreen;
