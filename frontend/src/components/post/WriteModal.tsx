import React, { useState, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, ImageIcon, Hash, ChevronDown, Loader2 } from 'lucide-react';
import type { CurrentUser } from '../../types';
import { useChannelStore, toast } from '../../stores';
import { uploadImage } from '../../api';

interface UploadedImage {
  url: string;
  key: string;
}

interface WriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string, images: UploadedImage[], channelId: string, hashtags: string[]) => void;
  currentUser: CurrentUser;
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 60;
  left: 50%;
  transform: translateX(-50%) ${props => props.$isOpen ? 'translateY(0)' : 'translateY(100%)'};
  width: 100%;
  max-width: 768px;
  transition: transform 0.3s ease-out;
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
`;

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: black;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  border-bottom: 1px solid #1f2937;
`;

const CloseButton = styled.button`
  color: #9ca3af;
  padding: 10px;
  margin-left: -10px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    color: white;
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const SubmitButton = styled.button<{ $active: boolean }>`
  min-width: 56px;
  height: 34px;
  padding: 0 16px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 14px;
  background-color: ${props => props.$active ? '#00D4AA' : '#374151'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  cursor: ${props => props.$active ? 'pointer' : 'not-allowed'};
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${props => props.$active ? '#00B894' : '#374151'};
  }

  svg {
    width: 16px;
    height: 16px;
    animation: ${spin} 1s linear infinite;
  }
`;

const TopicSelector = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: #1f2937;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
  border: 1px solid #374151;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
`;

const TitleInput = styled.input`
  width: 100%;
  background-color: transparent;
  color: white;
  font-size: 20px;
  font-weight: 700;
  border: none;
  outline: none;
  margin-bottom: 16px;

  &::placeholder {
    color: #9ca3af;
  }
`;

const ContentTextarea = styled.textarea`
  width: 100%;
  min-height: 60px;
  background-color: transparent;
  color: white;
  font-size: 16px;
  border: none;
  outline: none;
  resize: none;
  line-height: 1.6;
  overflow: hidden;

  &::placeholder {
    color: #9ca3af;
  }
`;

const ImagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const ImageWrapper = styled.div`
  position: relative;
  overflow: hidden;

  img {
    display: block;
    width: 100%;
    height: auto;
  }
`;

const RemoveBtn = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 10px;
  min-width: 44px;
  min-height: 44px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background-color: rgba(239, 68, 68, 0.8);
  }
`;

const UploadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  gap: 8px;

  svg {
    width: 20px;
    height: 20px;
    animation: ${spin} 1s linear infinite;
  }
`;

const Footer = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
`;

const FooterButton = styled.button`
  padding: 12px;
  min-width: 48px;
  min-height: 48px;
  color: #9ca3af;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    color: white;
    background-color: #1f2937;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ChannelDropdown = styled.div`
  position: absolute;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  overflow: hidden;
  z-index: 70;
  min-width: 200px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
`;

const ChannelOption = styled.button<{ $selected?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  color: ${props => props.$selected ? '#00D4AA' : '#d1d5db'};
  background-color: ${props => props.$selected ? 'rgba(0, 212, 170, 0.1)' : 'transparent'};

  &:hover {
    background-color: #374151;
  }
`;

// 해시태그 추출 함수
const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#[\w가-힣]+/g;
  const matches = content.match(hashtagRegex);
  if (!matches) return [];
  return [...new Set(matches.map(tag => tag.slice(1)))];
};

export const WriteModal: React.FC<WriteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const { channels } = useChannelStore();

  // 접근 가능한 채널만 필터링 (min/max 범위 + provider 체크)
  const accessibleChannels = channels.filter((ch) => {
    const aboveMin = currentUser.rawSubCount >= ch.minSubscribers;
    const belowMax = ch.maxSubscribers === null || currentUser.rawSubCount <= ch.maxSubscribers;
    const hasProviderAccess = !ch.providerOnly ||
      (currentUser.providers?.includes(ch.providerOnly) ?? false);
    return aboveMin && belowMax && hasProviderAccess;
  });

  const selectedChannel = channels.find((ch) => ch.id === selectedChannelId);
  const isValid = title.trim() && content.trim();
  const isUploading = uploadingIndex !== null;
  const MAX_IMAGES = 5;

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const remainingSlots = MAX_IMAGES - selectedImages.length;
      const filesToUpload = files.slice(0, remainingSlots);

      // 먼저 모든 프리뷰 URL 생성
      const previewUrls = filesToUpload.map(file => URL.createObjectURL(file));

      // 프리뷰 이미지 한번에 추가
      setSelectedImages(prev => [...prev, ...previewUrls]);

      // 각 파일 업로드
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const currentIndex = selectedImages.length + i;

        setUploadingIndex(currentIndex);

        try {
          const result = await uploadImage(file, 'posts');
          setUploadedImages(prev => [...prev, { url: result.url, key: result.key }]);
        } catch (error) {
          console.error('Failed to upload image:', error);
          // 실패한 이미지는 해당 프리뷰 URL로 찾아서 제거
          const failedPreviewUrl = previewUrls[i];
          setSelectedImages(prev => prev.filter(url => url !== failedPreviewUrl));
        }
      }
      setUploadingIndex(null);
    }
    // input 초기화 (같은 파일 다시 선택 가능)
    if (e.target) e.target.value = '';
  }, [selectedImages.length]);

  const handleRemoveImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleHashtag = useCallback(() => {
    setContent(prev => prev + ' #');
    contentRef.current?.focus();
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // 자동 높이 조절
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;

    // Channel selection required
    if (!selectedChannelId) {
      toast.warning('Please select a channel');
      setIsChannelDropdownOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const hashtags = extractHashtags(content);

      await onSubmit(title, content, uploadedImages, selectedChannelId, hashtags);

      // 초기화
      setTitle('');
      setContent('');
      setSelectedImages([]);
      setUploadedImages([]);
      setSelectedChannelId('');
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, title, content, uploadedImages, selectedChannelId, onSubmit]);

  const handleClose = useCallback(() => {
    setTitle('');
    setContent('');
    setSelectedImages([]);
    setUploadedImages([]);
    setSelectedChannelId('');
    setIsChannelDropdownOpen(false);
    onClose();
  }, [onClose]);

  const handleChannelSelect = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
    setIsChannelDropdownOpen(false);
  }, []);

  return (
    <ModalOverlay $isOpen={isOpen}>
      <ModalContainer>
        <Header>
          <CloseButton onClick={handleClose} aria-label="Close">
            <X />
          </CloseButton>
          <TopicSelector onClick={() => setIsChannelDropdownOpen(!isChannelDropdownOpen)}>
            {selectedChannel?.name || 'Select Channel'} <ChevronDown />
          </TopicSelector>
          <SubmitButton
            $active={!!isValid && !isUploading}
            onClick={handleSubmit}
            disabled={!isValid || isUploading || isSubmitting}
          >
            {isSubmitting ? <Loader2 /> : 'Post'}
          </SubmitButton>
        </Header>

        {isChannelDropdownOpen && (
          <ChannelDropdown>
            {accessibleChannels.length === 0 ? (
              <ChannelOption disabled>No accessible channels</ChannelOption>
            ) : (
              accessibleChannels.map((channel) => (
                <ChannelOption
                  key={channel.id}
                  $selected={selectedChannelId === channel.id}
                  onClick={() => handleChannelSelect(channel.id)}
                >
                  {channel.name}
                </ChannelOption>
              ))
            )}
          </ChannelDropdown>
        )}

        <Content onClick={() => setIsChannelDropdownOpen(false)}>
          <TitleInput
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <ContentTextarea
            ref={contentRef}
            placeholder="Write something... (#hashtags supported)"
            value={content}
            onChange={handleContentChange}
          />
          {selectedImages.length > 0 && (
            <ImagesContainer>
              {selectedImages.map((image, index) => (
                <ImageWrapper key={index}>
                  <img src={image} alt={`Preview ${index + 1}`} />
                  {uploadingIndex === index && (
                    <UploadingOverlay>
                      <Loader2 />
                      Uploading...
                    </UploadingOverlay>
                  )}
                  <RemoveBtn onClick={() => handleRemoveImage(index)} aria-label="Remove image">
                    <X />
                  </RemoveBtn>
                </ImageWrapper>
              ))}
            </ImagesContainer>
          )}
        </Content>

        <Footer>
          <FooterButton
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedImages.length >= MAX_IMAGES}
            style={{ opacity: selectedImages.length >= MAX_IMAGES ? 0.5 : 1 }}
            aria-label="Add image"
          >
            <ImageIcon />
          </FooterButton>
          <FooterButton onClick={handleHashtag} aria-label="Add hashtag">
            <Hash />
          </FooterButton>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
          />
        </Footer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default WriteModal;
