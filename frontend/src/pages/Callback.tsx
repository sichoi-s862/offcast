import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
`;

const Message = styled.p`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 20px;
`;

const TokenBox = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  word-break: break-all;
`;

const ChannelInfo = styled.div`
  background: #f0f8ff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
`;

const ChannelName = styled.p`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
`;

const SubscriberCount = styled.p`
  font-size: 1rem;
  color: #666;
`;

const ProviderBadge = styled.span`
  display: inline-block;
  background: #ff0000;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-bottom: 10px;
  text-transform: uppercase;
`;

const TokenLabel = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
`;

const Token = styled.code`
  display: block;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-bottom: 15px;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 10px;

  &:hover {
    background: #555;
  }
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 1rem;
`;

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const errorParam = searchParams.get('error');
    const channelNameParam = searchParams.get('channelName');
    const subscriberCountParam = searchParams.get('subscriberCount');
    const providerParam = searchParams.get('provider');

    if (tokenParam) {
      setToken(tokenParam);
      localStorage.setItem('token', tokenParam);
      setStatus('success');
      if (channelNameParam) setChannelName(channelNameParam);
      if (subscriberCountParam) setSubscriberCount(parseInt(subscriberCountParam, 10));
      if (providerParam) setProvider(providerParam);
    } else if (errorParam) {
      setError(errorParam);
      setStatus('error');
    } else {
      setError('No token received');
      setStatus('error');
    }
  }, [searchParams]);

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToLogin = () => {
    navigate('/');
  };

  if (status === 'loading') {
    return (
      <Container>
        <Message>처리 중...</Message>
      </Container>
    );
  }

  if (status === 'error') {
    return (
      <Container>
        <ErrorMessage>로그인 실패: {error}</ErrorMessage>
        <Button onClick={goToLogin}>다시 시도</Button>
      </Container>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Container>
      <Message>로그인 성공!</Message>
      <TokenBox>
        {channelName && (
          <ChannelInfo>
            {provider && <ProviderBadge>{provider}</ProviderBadge>}
            <ChannelName>{channelName}</ChannelName>
            {subscriberCount !== null && (
              <SubscriberCount>구독자 {formatNumber(subscriberCount)}명</SubscriberCount>
            )}
          </ChannelInfo>
        )}
        <TokenLabel>JWT 토큰:</TokenLabel>
        <Token>{token}</Token>
        <Button onClick={goToLogin}>홈으로 이동</Button>
        <Button onClick={() => navigator.clipboard.writeText(token || '')} style={{ background: '#666' }}>
          토큰 복사
        </Button>
      </TokenBox>
    </Container>
  );
}
