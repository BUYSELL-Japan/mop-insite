import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TermsContent {
  title: string;
  welcome: string;
  intro: string;
  sections: { heading: string; body: string }[];
  thanks: string;
}

// The in-app beta terms. English is the source; Korean is a translation of it (2026-11-17).
// zh-TW users are sent to an external page from Settings instead of this modal.
const TERMS: Record<'en' | 'ko', TermsContent> = {
  en: {
    title: 'Terms of Use (Beta Version)',
    welcome: 'Welcome to MOP!',
    intro: 'Please note that this app is currently in beta testing. By using MOP during this period, you understand and agree to the following:',
    sections: [
      { heading: 'Beta Disclaimer', body: 'This app is under active development. Features may change, and occasional bugs or errors may occur.' },
      { heading: 'No Warranty', body: 'We do not guarantee the accuracy, completeness, or availability of content or services. Use at your own discretion.' },
      { heading: 'User Responsibility', body: 'You are responsible for how you use the app. Please do not rely solely on MOP for critical travel decisions.' },
      { heading: 'Data & Privacy', body: 'We may collect limited usage data to improve the app, but we do not sell or share personal information.' },
      { heading: 'Feedback Welcome', body: 'Since this is a beta version, your feedback is very important. Feel free to contact us with ideas, bugs, or suggestions.' },
      { heading: 'Subject to Change', body: 'These terms may be updated at any time without notice as we move toward the official release.' },
    ],
    thanks: 'Thank you for being an early user of MOP! 🌏✨',
  },
  ko: {
    title: '이용약관 (베타 버전)',
    welcome: 'MOP에 오신 것을 환영합니다!',
    intro: '현재 이 앱은 베타 테스트 중입니다. 이 기간에 MOP를 이용하시면 아래 내용을 이해하고 이에 동의하신 것으로 간주합니다.',
    sections: [
      { heading: '베타 버전 안내', body: '이 앱은 현재 개발이 진행 중입니다. 기능이 변경될 수 있으며, 간혹 버그나 오류가 발생할 수 있습니다.' },
      { heading: '보증의 부인', body: '당사는 콘텐츠 및 서비스의 정확성, 완전성, 이용 가능성을 보증하지 않습니다. 이용자 본인의 판단에 따라 이용해 주십시오.' },
      { heading: '이용자의 책임', body: '앱의 이용 방법에 대한 책임은 이용자에게 있습니다. 중요한 여행 결정을 MOP에만 의존하지 마십시오.' },
      { heading: '데이터 및 개인정보', body: '당사는 앱 개선을 위해 제한된 범위의 이용 데이터를 수집할 수 있으나, 개인정보를 판매하거나 공유하지 않습니다.' },
      { heading: '피드백 환영', body: '베타 버전이므로 여러분의 피드백이 매우 중요합니다. 아이디어, 버그, 제안 사항이 있으시면 언제든지 연락해 주십시오.' },
      { heading: '약관의 변경', body: '정식 출시를 준비하는 과정에서 본 약관은 사전 통지 없이 언제든지 변경될 수 있습니다.' },
    ],
    thanks: 'MOP의 초기 이용자가 되어 주셔서 감사합니다! 🌏✨',
  },
};

export default function TermsOfUseModal({ isOpen, onClose }: TermsOfUseModalProps) {
  const { language } = useLanguage();
  if (!isOpen) return null;
  const terms = language === 'ko' ? TERMS.ko : TERMS.en;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{terms.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-gray-700">
          <div className="mb-6">
            <p className="text-base">{terms.welcome}</p>
            <p className="text-sm mt-2">{terms.intro}</p>
          </div>

          {terms.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="font-semibold text-base mb-2">{section.heading}</h3>
              <p className="text-sm">{section.body}</p>
            </section>
          ))}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">{terms.thanks}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
