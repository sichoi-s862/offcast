import type { Post } from '../types';
import { formatSubscriberCount } from '../utils/format';

const generateDummyPosts = (): Post[] => {
  const platforms = ['YouTube', 'TikTok', 'Twitter'];
  const titles = [
    '이번 알고리즘 변경점 분석했습니다', '조명 세팅 질문드립니다', '편집자 구인 팁 좀', '합방 하실 분 계신가요?',
    '수익 정산 원래 이렇게 느린가요?', '악플 고소 후기', '채널 방향성 고민입니다',
    '마이크 추천 부탁드려요 (슈어 vs 로데)', '썸네일 피드백 부탁드립니다', '구독자 이벤트 아이디어 공유',
    '송출컴 사양 질문', '동시 송출 설정법', 'MCN 계약 주의사항', '여행 브이로그 팁'
  ];
  const contents = [
    '진짜 너무 고민되네요. 선배님들 추천 부탁드립니다.',
    '다들 어떻게 생각하시나요? 댓글로 의견 남겨주세요.',
    '오늘 하루도 촬영 화이팅입니다!',
    '너무 답답해서 글 남겨봅니다 ㅠㅠ',
    '정보 공유 차원에서 글 씁니다. 도움이 되셨으면 좋겠네요.',
    '긴 글 읽어주셔서 감사합니다.',
    '질문이 있어서 글 남깁니다. 아시는 분 답변 부탁드려요.'
  ];

  const dummyPosts: Post[] = Array.from({ length: 100 }).map((_, i) => {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const nickname = `Creator${Math.floor(Math.random() * 1000)}`;
    const subCount = Math.floor(Math.random() * 1000000);
    const hasImage = Math.random() > 0.7;

    let channelId = 'free';
    const rand = Math.random();
    if (rand > 0.9) channelId = 'diamond';
    else if (rand > 0.8) channelId = 'gold';
    else if (rand > 0.7) channelId = 'silver';
    else if (rand > 0.55) channelId = 'gear';
    else if (rand > 0.4) channelId = 'collab';
    else if (rand > 0.25) channelId = 'feedback';

    return {
      id: i + 100,
      authorInfo: `${platform}|${nickname}|${formatSubscriberCount(subCount)}`,
      channelId: channelId,
      title: `${titles[Math.floor(Math.random() * titles.length)]} (${i + 1})`,
      content: contents[Math.floor(Math.random() * contents.length)],
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
      time: `${Math.floor(Math.random() * 24)}시간 전`,
      isLiked: false,
      image: hasImage ? `https://picsum.photos/seed/${i + 100}/400/300` : null,
    };
  });

  return dummyPosts;
};

export const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    authorInfo: 'YouTube|맛집탐험대|1000명+',
    channelId: 'feedback',
    title: '제 영상 썸네일 어떤가요? 피드백 부탁드립니다',
    content: '클릭률이 너무 안 나와서 고민입니다. 너무 복잡한가요?',
    likes: 12,
    comments: 5,
    time: '10분 전',
    isLiked: false,
    image: null,
  },
  {
    id: 2,
    authorInfo: 'Twitter|게임하는형|5000명+',
    channelId: 'gear',
    title: '투컴 세팅 오디오 인터페이스 추천 좀',
    content: '야마하 AG03 생각 중인데 괜찮을까요? 게임 소리랑 디코 소리 분리하고 싶습니다.',
    likes: 142,
    comments: 38,
    time: '1시간 전',
    isLiked: true,
    image: null,
  },
  {
    id: 3,
    authorInfo: 'TikTok|댄스머신|300명+',
    channelId: 'collab',
    title: '홍대 야외 방송 같이 하실 분 구해요!',
    content: '숏폼 챌린지 같이 찍으실 분! 장비는 제가 다 챙겨갑니다.',
    likes: 56,
    comments: 89,
    time: '3시간 전',
    isLiked: false,
    image: 'https://picsum.photos/seed/3/400/300',
  },
  {
    id: 4,
    authorInfo: 'YouTube|보라장인|100명+',
    channelId: 'free',
    title: '오늘 방송 대박났네요 ㅋㅋㅋ',
    content: '시청자 수 최고 기록 찍었습니다. 다들 화이팅하세요!',
    likes: 23,
    comments: 12,
    time: '5시간 전',
    isLiked: false,
    image: null,
  },
  ...generateDummyPosts()
];
