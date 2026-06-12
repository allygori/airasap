import React from 'react';
import OnboardingClient from './_components/onboarding.client';

const OnboardingPage = () => {
  return (
    <div className="relative container flex-1 shrink-0 items-center justify-center md:grid lg:max-w-none lg:px-0">
      <div className="grid max-w-6xl gap-4 md:gap-8">
        <h1 className="text-center text-xl font-bold md:text-3xl">
          Buat Organisasi Anda
        </h1>

        <p>
          Selamat datang! Mari buat organisasi dan toko
          pertama Anda untuk mulai menggunakan aplikasi.
        </p>

        <OnboardingClient />
      </div>
    </div>
  );
};

export default OnboardingPage;
