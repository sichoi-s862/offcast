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
  { value: 'GENERAL', label: 'General Inquiry' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'SUGGESTION', label: 'Feature Suggestion' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'ACCOUNT', label: 'Account Issue' },
  { value: 'OTHER', label: 'Other' },
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
  color: #9ca3af;

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
    color: #9ca3af;
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
    color: #9ca3af;
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
      toast.success('Your inquiry has been submitted. We will respond as soon as possible.');
      onBack();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Failed to submit inquiry.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <SubPageHeader title="Contact Us" onBack={onBack} />
      <Content>
        <Description>
          If you have any issues or suggestions, please let us know.
        </Description>

        <FormGroup>
          <Label>Category</Label>
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
          <Label>Subject</Label>
          <Input
            type="text"
            placeholder="Enter subject"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            maxLength={100}
          />
        </FormGroup>

        <FormGroup>
          <Label>Message</Label>
          <Textarea
            placeholder="Enter your message (min. 10 characters)"
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
            <><Spinner /> Submitting...</>
          ) : (
            <>Send <Send /></>
          )}
        </SubmitButton>
      </Content>
    </Container>
  );
};

export default ContactPage;
