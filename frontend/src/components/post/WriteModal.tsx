import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { X, ImageIcon, Hash, ChevronDown } from 'lucide-react';

interface WriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string, image: string | null) => void;
}

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
  padding: 8px;
  margin-left: -8px;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    color: white;
  }
`;

const SubmitButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 14px;
  background-color: ${props => props.$active ? '#7c3aed' : '#374151'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  cursor: ${props => props.$active ? 'pointer' : 'not-allowed'};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.$active ? '#6d28d9' : '#374151'};
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
  gap: 16px;
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

  &::placeholder {
    color: #4b5563;
  }
`;

const ContentTextarea = styled.textarea`
  width: 100%;
  flex: 1;
  min-height: 200px;
  background-color: transparent;
  color: white;
  font-size: 16px;
  border: none;
  outline: none;
  resize: none;
  line-height: 1.6;

  &::placeholder {
    color: #4b5563;
  }
`;

const ImagePreviewContainer = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #374151;

  img {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  color: white;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
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
  color: #9ca3af;
  border-radius: 8px;

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

export const WriteModal: React.FC<WriteModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [topic] = useState('자유 수다');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const isValid = title.trim() && content.trim();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imageUrl = URL.createObjectURL(e.target.files[0]);
      setSelectedImage(imageUrl);
    }
  };

  const handleHashtag = () => {
    setContent(prev => prev + " #");
    contentRef.current?.focus();
  };

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(title, content, selectedImage);
      setTitle('');
      setContent('');
      setSelectedImage(null);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setSelectedImage(null);
    onClose();
  };

  return (
    <ModalOverlay $isOpen={isOpen}>
      <ModalContainer>
        <Header>
          <CloseButton onClick={handleClose}>
            <X />
          </CloseButton>
          <TopicSelector>
            {topic} <ChevronDown />
          </TopicSelector>
          <SubmitButton $active={!!isValid} onClick={handleSubmit} disabled={!isValid}>
            등록
          </SubmitButton>
        </Header>

        <Content>
          <TitleInput
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <ContentTextarea
            ref={contentRef}
            placeholder="내용을 입력하세요"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          {selectedImage && (
            <ImagePreviewContainer>
              <img src={selectedImage} alt="Preview" />
              <RemoveImageButton onClick={() => setSelectedImage(null)}>
                <X />
              </RemoveImageButton>
            </ImagePreviewContainer>
          )}
        </Content>

        <Footer>
          <FooterButton onClick={() => fileInputRef.current?.click()}>
            <ImageIcon />
          </FooterButton>
          <FooterButton onClick={handleHashtag}>
            <Hash />
          </FooterButton>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
          />
        </Footer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default WriteModal;
