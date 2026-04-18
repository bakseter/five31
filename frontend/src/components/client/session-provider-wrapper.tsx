'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface SessionProviderWrapperProps {
    children: ReactNode;
    session?: Session;
}

const SessionProviderWrapper = ({ children, session }: SessionProviderWrapperProps) => (
    <SessionProvider session={session}>{children}</SessionProvider>
);

export default SessionProviderWrapper;
