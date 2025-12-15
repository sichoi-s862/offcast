import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Check, Loader2 } from 'lucide-react';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import { PlatformIcon } from '../../components/common/PlatformIcon';
import { getMyInfo, getBlockedUsers } from '../../api';
import type { CurrentUser } from '../../types';

interface MyInfoPageProps {
  currentUser: CurrentUser;
  onBack: () => void;
}

interface MyInfoData {
  user: {
    id: string;
    nickname: string;
    status: string;
    createdAt: string;
    accounts: Array<{
      provider: string;
      profileName: string | null;
      subscriberCount: number;
    }>;
  };
  stats: {
    postCount: number;
    commentCount: number;
  };
}

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background-color: black;
  animation: ${slideIn} 0.3s ease-out;
  max-width: 768px;
  margin: 0 auto;
`;

const Content = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Field = styled.div``;

const FieldLabel = styled.label`
  font-size: 14px;
  color: #6b7280;
  display: block;
  margin-bottom: 8px;
`;

const FieldValue = styled.div`
  color: white;
  font-size: 18px;
  font-weight: 700;
  padding: 16px;
  background-color: #111827;
  border-radius: 12px;
  border: 1px solid #1f2937;
`;

const PlatformValue = styled(FieldValue)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CheckBadge = styled.div`
  margin-left: auto;

  svg {
    width: 20px;
    height: 20px;
    color: #22c55e;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
`;

const Spinner = styled(Loader2)`
  width: 32px;
  height: 32px;
  color: #7c3aed;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const StatCard = styled.div`
  background-color: #111827;
  border-radius: 12px;
  border: 1px solid #1f2937;
  padding: 16px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

export const MyInfoPage: React.FC<MyInfoPageProps> = ({ currentUser, onBack }) => {
  const [myInfo, setMyInfo] = useState<MyInfoData | null>(null);
  const [blockedCount, setBlockedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoResult, blockedResult] = await Promise.all([
          getMyInfo(),
          getBlockedUsers({ page: 1, limit: 1 }),
        ]);
        setMyInfo(infoResult);
        setBlockedCount(blockedResult.total || 0);
      } catch (error) {
        console.error('Failed to fetch my info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Container>
        <SubPageHeader title="내 정보" onBack={onBack} />
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      </Container>
    );
  }

  const account = myInfo?.user?.accounts?.[0];

  return (
    <Container>
      <SubPageHeader title="내 정보" onBack={onBack} />
      <Content>
        <Field>
          <FieldLabel>연동된 계정</FieldLabel>
          <PlatformValue>
            <PlatformIcon provider={account?.provider || currentUser.provider} size={24} />
            {account?.profileName || currentUser.nickname}
            <CheckBadge>
              <Check />
            </CheckBadge>
          </PlatformValue>
        </Field>
        <Field>
          <FieldLabel>닉네임</FieldLabel>
          <FieldValue>{myInfo?.user?.nickname || currentUser.nickname}</FieldValue>
        </Field>
        <Field>
          <FieldLabel>구독자 수</FieldLabel>
          <FieldValue>
            {account?.subscriberCount?.toLocaleString() || currentUser.subscriberCount}
          </FieldValue>
        </Field>
        {myInfo?.user?.createdAt && (
          <Field>
            <FieldLabel>가입일</FieldLabel>
            <FieldValue>{formatDate(myInfo.user.createdAt)}</FieldValue>
          </Field>
        )}
        {myInfo?.stats && (
          <Field>
            <FieldLabel>활동 통계</FieldLabel>
            <StatsRow>
              <StatCard>
                <StatValue>{myInfo.stats.postCount}</StatValue>
                <StatLabel>작성 글</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{myInfo.stats.commentCount}</StatValue>
                <StatLabel>작성 댓글</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{blockedCount}</StatValue>
                <StatLabel>차단한 사용자</StatLabel>
              </StatCard>
            </StatsRow>
          </Field>
        )}
      </Content>
    </Container>
  );
};

export default MyInfoPage;
