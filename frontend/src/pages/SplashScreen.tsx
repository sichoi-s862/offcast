import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { OffcastLogo } from '../components/icons/PlatformIcons';

interface SplashScreenProps {
  onFinish: () => void;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background-color: black;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.7s ease-out;
  max-width: 768px;
  margin: 0 auto;
`;

const LogoWrapper = styled.div`
  width: 80px;
  height: 80px;
  background-color: #00D4AA;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 212, 170, 0.3);
  color: white;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.2em;
  animation: ${pulse} 2s infinite;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 12px;
  margin-top: 8px;
`;

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <Container>
      <LogoWrapper>
        <OffcastLogo size={48} />
      </LogoWrapper>
      <Title>OFFCAST</Title>
      <Subtitle>Anonymous Creator Community</Subtitle>
    </Container>
  );
};

export default SplashScreen;
