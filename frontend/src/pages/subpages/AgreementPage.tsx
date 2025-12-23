import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Check, Loader2, ChevronRight, Shield, ScrollText, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import { saveAgreements, getMyAgreements, type AgreementType, type UserAgreement } from '../../api';
import { incrementAppHistory } from '../../App';
import { toast } from '../../stores';

interface AgreementPageProps {
  onBack: () => void;
  onComplete?: () => void;
  isInitialSetup?: boolean;
}

const CURRENT_VERSION = '1.0.0';

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
  gap: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AgreementCard = styled.div`
  background-color: #111827;
  border-radius: 16px;
  overflow: hidden;
`;

const AgreementRow = styled.div<{ $clickable?: boolean; $isLast?: boolean }>`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 14px;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: background-color 0.2s;
  border-bottom: ${props => props.$isLast ? 'none' : '1px solid #1f2937'};

  &:hover {
    background-color: ${props => props.$clickable ? '#1a2332' : 'transparent'};
  }
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  background-color: #1f2937;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
    color: #9ca3af;
  }
`;

const RowContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RowTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RowSubtitle = styled.div`
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const Badge = styled.span<{ $type: 'required' | 'optional' | 'locked' }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  line-height: 1;
  background-color: ${props => {
    switch (props.$type) {
      case 'required': return 'rgba(239, 68, 68, 0.15)';
      case 'optional': return 'rgba(156, 163, 175, 0.15)';
      case 'locked': return 'rgba(0, 212, 170, 0.15)';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'required': return '#f87171';
      case 'optional': return '#9ca3af';
      case 'locked': return '#00D4AA';
    }
  }};

  svg {
    width: 10px;
    height: 10px;
  }
`;

const ChevronWrapper = styled.div`
  color: #4b5563;
  display: flex;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
  margin: -8px -12px -8px 0;

  svg {
    width: 20px;
    height: 20px;
  }
`;

// 토글 스위치 - 높이 정상화
const ToggleSwitch = styled.button<{ $checked: boolean }>`
  width: 52px;
  height: 32px;
  border-radius: 16px;
  background-color: ${props => props.$checked ? '#00D4AA' : '#374151'};
  position: relative;
  transition: background-color 0.2s;
  flex-shrink: 0;

  &::after {
    content: '';
    width: 26px;
    height: 26px;
    border-radius: 13px;
    background-color: white;
    position: absolute;
    top: 3px;
    left: ${props => props.$checked ? '23px' : '3px'};
    transition: left 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

// 토글 터치 영역 래퍼
const ToggleWrapper = styled.div`
  min-width: 52px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// 초기 설정용 체크박스 스타일
const CheckboxWrapper = styled.button<{ $checked: boolean; $disabled?: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid ${props => props.$checked ? '#00D4AA' : '#4b5563'};
  background-color: ${props => props.$checked ? '#00D4AA' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  flex-shrink: 0;
  opacity: ${props => props.$disabled ? 0.6 : 1};
  min-width: 44px;
  min-height: 44px;

  svg {
    width: 14px;
    height: 14px;
    color: white;
    opacity: ${props => props.$checked ? 1 : 0};
  }
`;

const InitialSetupCard = styled.div<{ $checked: boolean }>`
  background-color: #111827;
  border: 1px solid ${props => props.$checked ? '#00D4AA' : '#1f2937'};
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
`;

const InitialSetupRow = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
`;

const ButtonContainer = styled.div`
  margin-top: 8px;
`;

const SubmitButton = styled.button<{ disabled: boolean }>`
  width: 100%;
  padding: 16px;
  background-color: ${props => props.disabled ? '#374151' : '#00D4AA'};
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.disabled ? '#9ca3af' : 'white'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background-color: #00B894;
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
  color: #00D4AA;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const MarketingDescription = styled.p`
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.5;
  padding: 0 4px;
`;

interface Agreement {
  type: AgreementType;
  title: string;
  required: boolean;
  icon: React.ReactNode;
  route: string;
}

const AGREEMENTS: Agreement[] = [
  {
    type: 'TERMS_OF_SERVICE',
    title: 'Terms of Service',
    required: true,
    icon: <ScrollText />,
    route: '/terms',
  },
  {
    type: 'PRIVACY_POLICY',
    title: 'Privacy Policy',
    required: true,
    icon: <Shield />,
    route: '/privacy',
  },
  {
    type: 'MARKETING',
    title: 'Marketing Communications',
    required: false,
    icon: <Mail />,
    route: '',
  },
];

export const AgreementPage: React.FC<AgreementPageProps> = ({
  onBack,
  onComplete,
  isInitialSetup = false,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<AgreementType, boolean>>({
    TERMS_OF_SERVICE: false,
    PRIVACY_POLICY: false,
    MARKETING: false,
  });
  const [existingAgreements, setExistingAgreements] = useState<UserAgreement[]>([]);
  const [initialMarketing, setInitialMarketing] = useState(false);

  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        const result = await getMyAgreements();
        setExistingAgreements(result.agreements);

        const checked: Record<AgreementType, boolean> = {
          TERMS_OF_SERVICE: false,
          PRIVACY_POLICY: false,
          MARKETING: false,
        };
        result.agreements.forEach(agreement => {
          checked[agreement.agreementType] = true;
        });
        setCheckedItems(checked);
        setInitialMarketing(checked.MARKETING);
      } catch (error) {
        console.error('Failed to fetch agreements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgreements();
  }, []);

  const handleToggle = (type: AgreementType) => {
    if (!isInitialSetup && AGREEMENTS.find(a => a.type === type)?.required) {
      return;
    }
    setCheckedItems(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleViewAgreement = (route: string) => {
    if (route) {
      incrementAppHistory();
      navigate(route);
    }
  };

  const handleSubmit = async () => {
    if (isSaving) return;

    if (!isInitialSetup) {
      if (checkedItems.MARKETING !== initialMarketing) {
        setIsSaving(true);
        try {
          const agreements: { type: AgreementType; version: string }[] = [
            { type: 'TERMS_OF_SERVICE', version: CURRENT_VERSION },
            { type: 'PRIVACY_POLICY', version: CURRENT_VERSION },
          ];
          if (checkedItems.MARKETING) {
            agreements.push({ type: 'MARKETING', version: CURRENT_VERSION });
          }
          await saveAgreements(agreements);
          toast.success(checkedItems.MARKETING
            ? 'Marketing communications enabled.'
            : 'Marketing communications disabled.');
          onBack();
        } catch (error) {
          console.error('Failed to save agreements:', error);
          toast.error('Failed to save changes.');
          setIsSaving(false);
        }
      } else {
        onBack();
      }
      return;
    }

    const requiredAgreements = AGREEMENTS.filter(a => a.required);
    const hasAllRequired = requiredAgreements.every(a => checkedItems[a.type]);

    if (!hasAllRequired) return;

    setIsSaving(true);
    try {
      const agreements = Object.entries(checkedItems)
        .filter(([_, checked]) => checked)
        .map(([type]) => ({
          type: type as AgreementType,
          version: CURRENT_VERSION,
        }));

      await saveAgreements(agreements);

      if (onComplete) {
        onComplete();
      } else {
        onBack();
      }
    } catch (error) {
      console.error('Failed to save agreements:', error);
      setIsSaving(false);
    }
  };

  const getAgreedAt = (type: AgreementType): string | null => {
    const existing = existingAgreements.find(a => a.agreementType === type);
    if (!existing) return null;
    const date = new Date(existing.agreedAt);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const hasChanges = !isInitialSetup && checkedItems.MARKETING !== initialMarketing;

  const canSubmit = isInitialSetup
    ? AGREEMENTS.filter(a => a.required).every(a => checkedItems[a.type])
    : true;

  if (isLoading) {
    return (
      <Container>
        <SubPageHeader
          title={isInitialSetup ? 'Terms & Conditions' : 'Agreements'}
          onBack={onBack}
        />
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      </Container>
    );
  }

  // 마이페이지 UI
  if (!isInitialSetup) {
    const requiredAgreements = AGREEMENTS.filter(a => a.required);
    const marketingAgreement = AGREEMENTS.find(a => a.type === 'MARKETING')!;
    const marketingAgreedAt = getAgreedAt('MARKETING');

    return (
      <Container>
        <SubPageHeader title="Agreements" onBack={onBack} />
        <Content>
          {/* 필수 약관 섹션 */}
          <Section>
            <SectionTitle>Required Agreements</SectionTitle>
            <AgreementCard>
              {requiredAgreements.map((agreement, index) => {
                const agreedAt = getAgreedAt(agreement.type);
                return (
                  <AgreementRow
                    key={agreement.type}
                    $clickable={!!agreement.route}
                    $isLast={index === requiredAgreements.length - 1}
                    onClick={() => handleViewAgreement(agreement.route)}
                  >
                    <IconWrapper>
                      {agreement.icon}
                    </IconWrapper>
                    <RowContent>
                      <RowTitle>
                        {agreement.title}
                        <Badge $type="locked">
                          <Check />
                          Agreed
                        </Badge>
                      </RowTitle>
                      {agreedAt && (
                        <RowSubtitle>
                          <Calendar />
                          {agreedAt}
                        </RowSubtitle>
                      )}
                    </RowContent>
                    {agreement.route && (
                      <ChevronWrapper>
                        <ChevronRight />
                      </ChevronWrapper>
                    )}
                  </AgreementRow>
                );
              })}
            </AgreementCard>
          </Section>

          {/* 마케팅 수신 섹션 */}
          <Section>
            <SectionTitle>Optional</SectionTitle>
            <AgreementCard>
              <AgreementRow $isLast>
                <IconWrapper>
                  {marketingAgreement.icon}
                </IconWrapper>
                <RowContent>
                  <RowTitle>{marketingAgreement.title}</RowTitle>
                  <RowSubtitle>
                    {checkedItems.MARKETING ? (
                      marketingAgreedAt ? (
                        <>
                          <Calendar />
                          Enabled since {marketingAgreedAt}
                        </>
                      ) : 'Enabled'
                    ) : 'Receive updates and promotions'}
                  </RowSubtitle>
                </RowContent>
                <ToggleWrapper>
                  <ToggleSwitch
                    $checked={checkedItems.MARKETING}
                    onClick={() => handleToggle('MARKETING')}
                    aria-label="Toggle marketing communications"
                  />
                </ToggleWrapper>
              </AgreementRow>
            </AgreementCard>
            <MarketingDescription>
              Get notified about new features, events, and special offers. You can change this setting anytime.
            </MarketingDescription>
          </Section>

          {hasChanges && (
            <ButtonContainer>
              <SubmitButton disabled={isSaving} onClick={handleSubmit}>
                {isSaving ? (
                  <>
                    <Spinner style={{ width: 20, height: 20 }} />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </SubmitButton>
            </ButtonContainer>
          )}
        </Content>
      </Container>
    );
  }

  // 초기 설정 UI
  return (
    <Container>
      <SubPageHeader title="Terms & Conditions" onBack={onBack} />
      <Content>
        <Section>
          {AGREEMENTS.map(agreement => (
            <InitialSetupCard key={agreement.type} $checked={checkedItems[agreement.type]}>
              <InitialSetupRow>
                <CheckboxWrapper
                  $checked={checkedItems[agreement.type]}
                  onClick={() => handleToggle(agreement.type)}
                >
                  <Check />
                </CheckboxWrapper>
                <IconWrapper>
                  {agreement.icon}
                </IconWrapper>
                <RowContent>
                  <RowTitle>
                    {agreement.title}
                    <Badge $type={agreement.required ? 'required' : 'optional'}>
                      {agreement.required ? 'Required' : 'Optional'}
                    </Badge>
                  </RowTitle>
                </RowContent>
                {agreement.route && (
                  <ChevronWrapper
                    as="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleViewAgreement(agreement.route);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <ChevronRight />
                  </ChevronWrapper>
                )}
              </InitialSetupRow>
            </InitialSetupCard>
          ))}
        </Section>

        <ButtonContainer>
          <SubmitButton disabled={!canSubmit || isSaving} onClick={handleSubmit}>
            {isSaving ? (
              <>
                <Spinner style={{ width: 20, height: 20 }} />
                Saving...
              </>
            ) : 'Continue'}
          </SubmitButton>
        </ButtonContainer>
      </Content>
    </Container>
  );
};

export default AgreementPage;
