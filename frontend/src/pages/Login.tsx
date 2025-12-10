import styled from 'styled-components';
import { getLoginUrl, type Provider } from '../api/auth';

const providers: { id: Provider; name: string; color: string }[] = [
  { id: 'youtube', name: 'YouTube', color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', color: '#000000' },
  { id: 'soop', name: 'SOOP (숲)', color: '#5C3EBC' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F' },
  { id: 'chzzk', name: 'Chzzk (치지직)', color: '#00FFA3' },
];

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 40px;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 350px;
`;

const LoginButton = styled.a<{ $bgColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 25px;
  background-color: ${(props) => props.$bgColor};
  color: ${(props) => (props.$bgColor === '#00FFA3' ? '#000' : '#fff')};
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const TokenSection = styled.div`
  margin-top: 40px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 350px;
`;

const TokenTitle = styled.h3`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
`;

const TokenInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 10px;
`;

const TokenButton = styled.button`
  width: 100%;
  padding: 10px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: #555;
  }
`;

export default function Login() {
  const handleTokenLogin = () => {
    const input = document.getElementById('token-input') as HTMLInputElement;
    const token = input.value.trim();
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/dashboard';
    }
  };

  return (
    <Container>
      <Title>Offcast</Title>
      <Subtitle>소셜 플랫폼 OAuth 테스트</Subtitle>

      <ButtonContainer>
        {providers.map((provider) => (
          <LoginButton
            key={provider.id}
            href={getLoginUrl(provider.id)}
            $bgColor={provider.color}
          >
            {provider.name} 로그인
          </LoginButton>
        ))}
      </ButtonContainer>

      <TokenSection>
        <TokenTitle>또는 JWT 토큰으로 로그인</TokenTitle>
        <TokenInput id="token-input" placeholder="JWT 토큰 입력..." />
        <TokenButton onClick={handleTokenLogin}>토큰으로 로그인</TokenButton>
      </TokenSection>
    </Container>
  );
}
