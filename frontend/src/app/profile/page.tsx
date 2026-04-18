import { redirect } from 'next/navigation';

import { auth } from '@/api/auth';
import Button from '@/components/client/button';
import ProfileInputForm from '@/components/client/profile-input-form';
import BaseWeightsForm from '@/components/server/base-weights-form';

const ProfilePage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/api/auth/signin');

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <BaseWeightsForm />

                <div className="flex flex-col gap-6">
                    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Account</h3>
                        <dl className="flex flex-col gap-3">
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">Name</dt>
                                <dd className="mt-0.5 text-sm font-medium text-slate-800" data-cy="profile-name">
                                    {session.user.name}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">Email</dt>
                                <dd className="mt-0.5 text-sm font-medium text-slate-800" data-cy="profile-email">
                                    {session.user.email}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Profile</h3>
                        <ProfileInputForm />
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
                <form action="/api/auth/signout" method="get">
                    <Button
                        type="submit"
                        className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                        Sign out
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
