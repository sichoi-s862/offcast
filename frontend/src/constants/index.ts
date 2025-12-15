import type { Channel } from '../types';

export const CHANNELS: Channel[] = [
  { id: 'all', name: '전체', minSubs: 0 },
  { id: 'free', name: '자유 수다', minSubs: 0 },
  { id: 'collab', name: '합방/게스트', minSubs: 0 },
  { id: 'gear', name: '장비/세팅', minSubs: 0 },
  { id: 'feedback', name: '피드백/평가', minSubs: 0 },
  { id: 'silver', name: '10만+ 라운지', minSubs: 100000 },
  { id: 'gold', name: '50만+ 라운지', minSubs: 500000 },
  { id: 'diamond', name: '100만+ 라운지', minSubs: 1000000 },
];

export const REPORT_REASONS = [
  { label: "스팸 / 부적절한 홍보", value: "SPAM" },
  { label: "욕설 / 비하 발언", value: "HARASSMENT" },
  { label: "음란물 / 선정적인 콘텐츠", value: "INAPPROPRIATE" },
  { label: "혐오 발언 / 허위정보", value: "MISINFORMATION" },
  { label: "저작권 침해", value: "COPYRIGHT" },
  { label: "기타", value: "OTHER" },
] as const;

export const FAQS = [
  { q: "닉네임은 어떻게 변경하나요?", a: "마이페이지 > 닉네임 수정 메뉴에서 변경하실 수 있습니다." },
  { q: "등급은 어떻게 산정되나요?", a: "연동된 플랫폼의 구독자/팔로워 수를 기준으로 실시간 반영됩니다." },
  { q: "탈퇴하면 글도 삭제되나요?", a: "탈퇴 시 모든 개인정보는 파기되나, 작성하신 글은 자동으로 삭제되지 않습니다." },
  { q: "광고 문의는 어디로 하나요?", a: "하단의 문의하기 기능을 통해 제휴 제안을 선택하여 보내주세요." },
];

export const TERMS = `제1조 (목적)
이 약관은 회사가 제공하는 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.

제2조 (개인정보의 수집)
회사는 서비스 제공을 위해 필요한 최소한의 개인정보를 수집합니다.
1. 필수항목: 플랫폼 ID, 닉네임, 구독자 수
2. 수집방법: 소셜 로그인 연동

제3조 (개인정보의 보유)
회원은 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 탈퇴 시 지체 없이 파기됩니다.`;
