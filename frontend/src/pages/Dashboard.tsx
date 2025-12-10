import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getMe, getAllStats, type User, type SocialStats } from '../api/auth';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #333;
`;

const LogoutButton = styled.button`
  padding: 10px 20px;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #c0392b;
  }
`;

const Section = styled.section`
  background: #fff;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
`;

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const AccountItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const AccountInfo = styled.div`
  flex: 1;
`;

const AccountName = styled.p`
  font-weight: 600;
  color: #333;
`;

const AccountProvider = styled.p`
  font-size: 0.85rem;
  color: #666;
  text-transform: capitalize;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
`;

const StatCard = styled.div<{ $hasError?: boolean }>`
  padding: 20px;
  background: ${(props) => (props.$hasError ? '#fff5f5' : '#f0f8ff')};
  border-radius: 8px;
  text-align: center;
`;

const StatProvider = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
  text-transform: capitalize;
`;

const StatValue = styled.p`
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
`;

const StatLabel = styled.p`
  font-size: 0.8rem;
  color: #999;
`;

const ErrorText = styled.p`
  color: #e74c3c;
  font-size: 0.85rem;
`;

const Loading = styled.div`
  text-align: center;
  padding: 50px;
  color: #666;
`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<SocialStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [userData, statsData] = await Promise.all([
          getMe(token),
          getAllStats(token),
        ]);
        setUser(userData);
        setStats(statsData);
      } catch (err) {
        setError('데이터를 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <Container>
        <Loading>로딩 중...</Loading>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Section>
          <ErrorText>{error}</ErrorText>
          <LogoutButton onClick={handleLogout} style={{ marginTop: '20px' }}>
            다시 로그인
          </LogoutButton>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>대시보드</Title>
        <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
      </Header>

      <Section>
        <SectionTitle>연결된 계정</SectionTitle>
        <AccountList>
          {user?.accounts.map((account) => (
            <AccountItem key={account.id}>
              {account.profileImage ? (
                <Avatar src={account.profileImage} alt={account.profileName || ''} />
              ) : (
                <AvatarPlaceholder>
                  {account.profileName?.[0] || '?'}
                </AvatarPlaceholder>
              )}
              <AccountInfo>
                <AccountName>{account.profileName || 'Unknown'}</AccountName>
                <AccountProvider>{account.provider}</AccountProvider>
              </AccountInfo>
            </AccountItem>
          ))}
        </AccountList>
      </Section>

      <Section>
        <SectionTitle>소셜 통계</SectionTitle>
        <StatsGrid>
          {stats.map((stat) => (
            <StatCard key={stat.provider} $hasError={!!stat.error}>
              <StatProvider>{stat.provider}</StatProvider>
              {stat.error ? (
                <ErrorText>{stat.error}</ErrorText>
              ) : (
                <>
                  <StatValue>
                    {formatNumber(
                      stat.subscriberCount || stat.followerCount || stat.fanCount
                    )}
                  </StatValue>
                  <StatLabel>
                    {stat.subscriberCount !== undefined && '구독자'}
                    {stat.followerCount !== undefined && '팔로워'}
                    {stat.fanCount !== undefined && '팬'}
                  </StatLabel>
                  {stat.viewCount !== undefined && (
                    <>
                      <StatValue style={{ fontSize: '1.2rem', marginTop: '10px' }}>
                        {formatNumber(stat.viewCount)}
                      </StatValue>
                      <StatLabel>조회수</StatLabel>
                    </>
                  )}
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>
      </Section>
    </Container>
  );
}
