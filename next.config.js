/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    transpilePackages:[
        'react-native-web',
        'lucide-react-native'
    ],
    webpack: (config) => {
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            'react-native$': 'react-native-web',
        };
        config.resolve.extensions = [
            '.web.js',
            '.web.ts',
            '.web.tsx',
            ...config.resolve.extensions,
        ];
        return config;
    }
};
module.exports = nextConfig;