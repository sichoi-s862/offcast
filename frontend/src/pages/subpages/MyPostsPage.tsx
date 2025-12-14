import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FileText, ThumbsUp, MessageCircle } from 'lucide-react';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import type { Post, CurrentUser } from '../../types';

interface MyPostsPageProps {
  posts: Post[];
  currentUser: CurrentUser;
  onBack: () => void;
  onPostClick: (post: Post) => void;
}

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background-color: black;
  padding-bottom: 80px;
  animation: ${slideIn} 0.3s ease-out;
  max-width: 768px;
  margin: 0 auto;
`;

const PostList = styled.div`
  & > * + * {
    border-top: 1px solid #1f2937;
  }
`;

const PostItem = styled.div`
  padding: 16px;
  cursor: pointer;

  &:hover {
    background-color: rgba(17, 24, 39, 0.5);
  }
`;

const PostTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PostContent = styled.p`
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const EmptyState = styled.div`
  padding: 80px 20px;
  text-align: center;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  svg {
    width: 48px;
    height: 48px;
    opacity: 0.2;
  }
`;

export const MyPostsPage: React.FC<MyPostsPageProps> = ({
  posts,
  currentUser,
  onBack,
  onPostClick
}) => {
  const myPosts = posts.filter(p => p.authorInfo.includes(currentUser.nickname));

  return (
    <Container>
      <SubPageHeader title="내가 쓴 글" onBack={onBack} />
      {myPosts.length > 0 ? (
        <PostList>
          {myPosts.map(post => (
            <PostItem key={post.id} onClick={() => onPostClick(post)}>
              <PostTitle>{post.title}</PostTitle>
              <PostContent>{post.content}</PostContent>
              <PostMeta>
                <span>{post.time}</span>
                <MetaItem>
                  <ThumbsUp /> {post.likes}
                </MetaItem>
                <MetaItem>
                  <MessageCircle /> {post.comments}
                </MetaItem>
              </PostMeta>
            </PostItem>
          ))}
        </PostList>
      ) : (
        <EmptyState>
          <FileText />
          <p>작성한 글이 없습니다.</p>
        </EmptyState>
      )}
    </Container>
  );
};

export default MyPostsPage;
