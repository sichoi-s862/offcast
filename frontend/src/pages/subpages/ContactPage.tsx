import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Send, Loader2, ChevronDown } from 'lucide-react';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import { createInquiry, type InquiryCategory } from '../../api';
import { toast } from '../../stores';

interface ContactPageProps {
  onBack: () => void;
}

const INQUIRY_CATEGORIES: Array<{ value: InquiryCategory; label: string }> = [
  { value: 'GENERAL', label: '일반 문의' },
  { value: 'BUG_REPORT', label: '버그 신고' },
  { value: 'SUGGESTION', label: '기능 제안' },
  { value: 'PARTNERSHIP', label: '제휴 문의' },
  { value: 'ACCOUNT', label: '계정 관련' },
  { value: 'OTHER', label: '기타' },
];

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
`;

const Description = styled.p`
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 8px;
`;

const SelectWrapper = styled.div`
  position: relative;
`;

const Select = styled.select`
  width: 100%;
  background-color: #111827;
  color: white;
  padding: 16px;
  padding-right: 40px;
  border-radius: 12px;
  border: 1px solid #1f2937;
  outline: none;
  font-size: 16px;
  appearance: none;
  cursor: pointer;

  &:focus {
    border-color: white;
  }
`;

const SelectIcon = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #6b7280;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Input = styled.input`
  width: 100%;
  background-color: #111827;
  color: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #1f2937;
  outline: none;
  font-size: 16px;

  &:focus {
    border-color: white;
  }

  &::placeholder {
    color: #6b7280;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 160px;
  background-color: #111827;
  color: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #1f2937;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 1.6;

  &:focus {
    border-color: white;
  }

  &::placeholder {
    color: #6b7280;
  }
`;

const ErrorText = styled.p`
  color: #f87171;
  font-size: 12px;
  margin-top: 8px;
`;

const SubmitButton = styled.button<{ $active: boolean; $loading?: boolean }>`
  width: 100%;
  margin-top: 24px;
  padding: 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: ${props => props.$active ? '#3b82f6' : '#1f2937'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  cursor: ${props => props.$active && !props.$loading ? 'pointer' : 'not-allowed'};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.$active && !props.$loading ? '#2563eb' : ''};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [category, setCategory] = useState<InquiryCategory>('GENERAL');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = title.trim().length >= 2 && content.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createInquiry({
        category,
        title: title.trim(),
        content: content.trim(),
      });
      toast.success('문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.');
      onBack();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || '문의 접수에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <SubPageHeader title="문의하기" onBack={onBack} />
      <Content>
        <Description>
          서비스 이용 중 불편한 점이나 제안하실 내용이 있다면 보내주세요.
        </Description>

        <FormGroup>
          <Label>문의 유형</Label>
          <SelectWrapper>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as InquiryCategory)}
              disabled={isSubmitting}
            >
              {INQUIRY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
            <SelectIcon><ChevronDown /></SelectIcon>
          </SelectWrapper>
        </FormGroup>

        <FormGroup>
          <Label>제목</Label>
          <Input
            type="text"
            placeholder="제목을 입력해주세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            maxLength={100}
          />
        </FormGroup>

        <FormGroup>
          <Label>내용</Label>
          <Textarea
            placeholder="내용을 입력해주세요 (최소 10자)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            maxLength={2000}
          />
        </FormGroup>

        {error && <ErrorText>{error}</ErrorText>}

        <SubmitButton
          $active={isValid}
          $loading={isSubmitting}
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <><Spinner /> 접수 중...</>
          ) : (
            <>보내기 <Send /></>
          )}
        </SubmitButton>
      </Content>
    </Container>
  );
};

export default ContactPage;
