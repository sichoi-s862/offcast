import type { Post } from '../types';
import { formatSubscriberCount } from '../utils/format';

const generateDummyPosts = (): Post[] => {
  const platforms = ['YouTube', 'TikTok', 'Twitter'];
  const titles = [
    'Algorithm changes analysis', 'Lighting setup questions', 'Editor hiring tips', 'Looking for collab partners',
    'Is revenue payout always this slow?', 'Dealing with hate comments', 'Channel direction concerns',
    'Mic recommendations (Shure vs Rode)', 'Thumbnail feedback please', 'Subscriber event ideas',
    'Streaming PC specs question', 'Dual streaming setup', 'MCN contract tips', 'Travel vlog tips'
  ];
  const contents = [
    'Really struggling with this. Any advice from experienced creators?',
    'What do you all think? Let me know in the comments.',
    'Keep grinding everyone! Good luck with your content today!',
    'Just needed to vent a bit...',
    'Sharing this info in case it helps someone else.',
    'Thanks for reading this long post.',
    'Got a question - anyone know the answer?'
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
      time: `${Math.floor(Math.random() * 24)}h ago`,
      isLiked: false,
      image: hasImage ? `https://picsum.photos/seed/${i + 100}/400/300` : null,
    };
  });

  return dummyPosts;
};

export const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    authorInfo: 'YouTube|FoodExplorer|1K+',
    channelId: 'feedback',
    title: 'What do you think of my thumbnail? Need feedback!',
    content: 'My CTR is really low. Is it too cluttered?',
    likes: 12,
    comments: 5,
    time: '10m ago',
    isLiked: false,
    image: null,
  },
  {
    id: 2,
    authorInfo: 'Twitter|GamerBro|5K+',
    channelId: 'gear',
    title: 'Audio interface recommendations for dual PC setup',
    content: 'Thinking about Yamaha AG03. Is it good? Want to separate game audio and Discord.',
    likes: 142,
    comments: 38,
    time: '1h ago',
    isLiked: true,
    image: null,
  },
  {
    id: 3,
    authorInfo: 'TikTok|DanceMachine|300+',
    channelId: 'collab',
    title: 'Looking for outdoor streaming partners!',
    content: 'Want to film short-form challenges together! I\'ll bring all the equipment.',
    likes: 56,
    comments: 89,
    time: '3h ago',
    isLiked: false,
    image: 'https://picsum.photos/seed/3/400/300',
  },
  {
    id: 4,
    authorInfo: 'YouTube|ProGamer|100+',
    channelId: 'free',
    title: 'Today\'s stream was amazing!',
    content: 'Hit my viewer record! Keep grinding everyone!',
    likes: 23,
    comments: 12,
    time: '5h ago',
    isLiked: false,
    image: null,
  },
  ...generateDummyPosts()
];
