import React from 'react';
import { X } from 'lucide-react';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfUseModal({ isOpen, onClose }: TermsOfUseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Terms of Use (Beta Version)</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-gray-700">
          <div className="mb-6">
            <p className="text-base">Welcome to MOP!</p>
            <p className="text-sm mt-2">
              Please note that this app is currently in beta testing. By using MOP during this period, you understand and agree to the following:
            </p>
          </div>

          <section>
            <h3 className="font-semibold text-base mb-2">Beta Disclaimer</h3>
            <p className="text-sm">
              This app is under active development. Features may change, and occasional bugs or errors may occur.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">No Warranty</h3>
            <p className="text-sm">
              We do not guarantee the accuracy, completeness, or availability of content or services. Use at your own discretion.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">User Responsibility</h3>
            <p className="text-sm">
              You are responsible for how you use the app. Please do not rely solely on MOP for critical travel decisions.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Data & Privacy</h3>
            <p className="text-sm">
              We may collect limited usage data to improve the app, but we do not sell or share personal information.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Feedback Welcome</h3>
            <p className="text-sm">
              Since this is a beta version, your feedback is very important. Feel free to contact us with ideas, bugs, or suggestions.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Subject to Change</h3>
            <p className="text-sm">
              These terms may be updated at any time without notice as we move toward the official release.
            </p>
          </section>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Thank you for being an early user of MOP! 🌏✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}