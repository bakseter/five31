import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
});

export default withPWA({
    reactStrictMode: true,
    output: 'standalone',
    turbopack: {},
});
